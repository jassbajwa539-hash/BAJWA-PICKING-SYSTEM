from collections import OrderedDict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.pick_tasks import PickTask
from app.models.pick_serials import PickSerial
from app.models.inventory import Inventory

from app.auth.dependencies import get_current_user

router = APIRouter(tags=["RF Picking"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------------
# GET CURRENT LOCATION
# -------------------------------------------------------

@router.get("/rf/location")
def get_current_location(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    first_task = (
        db.query(PickTask)
        .filter(PickTask.status == "PENDING")
        .order_by(
            PickTask.location,
            PickTask.box,
            PickTask.sequence
        )
        .first()
    )

    if not first_task:
        return {
            "completed": True,
            "message": "Picking Completed"
        }

    location = first_task.location

    tasks = (
        db.query(PickTask)
        .filter(
            PickTask.location == location,
            PickTask.status == "PENDING"
        )
        .order_by(
            PickTask.box,
            PickTask.sequence
        )
        .all()
    )

    boxes = OrderedDict()

    total_boxes = 0
    total_skus = 0
    total_serials = 0

    for task in tasks:

        if task.box not in boxes:

            boxes[task.box] = []

            total_boxes += 1

        boxes[task.box].append({

            "task_id": task.id,

            "order_no": task.order_no,

            "sku": task.sku,

            "required_qty": task.required_qty,

            "picked_qty": task.picked_qty,

            "remaining_qty": task.required_qty - task.picked_qty

        })

        total_skus += 1

        total_serials += (
            task.required_qty - task.picked_qty
        )

    return {

        "completed": False,

        "picker": current_user["username"],

        "location": location,

        "total_boxes": total_boxes,

        "total_skus": total_skus,

        "total_serials": total_serials,

        "boxes": boxes

    }
from pydantic import BaseModel


# -------------------------------------------------------
# LOCATION SCAN MODEL
# -------------------------------------------------------

class LocationScan(BaseModel):
    location: str


# -------------------------------------------------------
# SCAN LOCATION
# -------------------------------------------------------

@router.post("/rf/scan-location")
def scan_location(
    data: LocationScan,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    current = (
        db.query(PickTask)
        .filter(PickTask.status == "PENDING")
        .order_by(
            PickTask.location,
            PickTask.box,
            PickTask.sequence
        )
        .first()
    )

    if not current:
        return {
            "completed": True,
            "message": "Picking Completed"
        }

    expected = current.location.strip().upper()
    scanned = data.location.strip().upper()

    if scanned != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Wrong Location. Expected {expected}"
        )

    return {
        "success": True,
        "location": expected,
        "message": "Location Verified"
    }
from pydantic import BaseModel

# -------------------------------------------------------
# BOX SCAN MODEL
# -------------------------------------------------------

class BoxScan(BaseModel):
    task_id: int
    box: str


# -------------------------------------------------------
# SCAN BOX
# -------------------------------------------------------

@router.post("/rf/scan-box")
def scan_box(
    data: BoxScan,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # Get Task
    task = (
        db.query(PickTask)
        .filter(PickTask.id == data.task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task Not Found"
        )

    # Compare scanned box
    expected_box = task.box.strip().upper()
    scanned_box = data.box.strip().upper()

    if expected_box != scanned_box:
        raise HTTPException(
            status_code=400,
            detail=f"Wrong Box. Expected {expected_box}"
        )

    # Box verified
    return {

        "success": True,

        "message": "Box Verified",

        "task_id": task.id,

        "box": task.box,

        "location": task.location,

        "sku": task.sku,

        "required_qty": task.required_qty,

        "picked_qty": task.picked_qty,

        "remaining_qty": task.required_qty - task.picked_qty

    }
from pydantic import BaseModel


# -------------------------------------------------------
# SERIAL SCAN MODEL
# -------------------------------------------------------

class SerialScan(BaseModel):
    task_id: int
    serial: str


# -------------------------------------------------------
# SCAN SERIAL
# -------------------------------------------------------

@router.post("/rf/scan-serial")
def scan_serial(
    data: SerialScan,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # -----------------------------------------
    # Find Task
    # -----------------------------------------

    task = (
        db.query(PickTask)
        .filter(PickTask.id == data.task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task Not Found"
        )

    # -----------------------------------------
    # Find Serial
    # -----------------------------------------

    serial = (
        db.query(PickSerial)
        .filter(
            PickSerial.task_id == task.id,
            PickSerial.serial_no == data.serial,
            PickSerial.status == "PENDING"
        )
        .first()
    )

    if not serial:
        raise HTTPException(
            status_code=400,
            detail="Invalid / Already Picked Serial"
        )

    # -----------------------------------------
    # Update Serial
    # -----------------------------------------

    serial.status = "PICKED"

    # -----------------------------------------
    # Update Inventory
    # -----------------------------------------

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.serial_no == data.serial
        )
        .first()
    )

    if inventory:
        inventory.status = "PICKED"

    # -----------------------------------------
    # Update Task
    # -----------------------------------------

    task.picked_qty += 1

    if task.picked_qty >= task.required_qty:
        task.status = "COMPLETED"

    db.commit()

    # -----------------------------------------
    # Find Next Pending Task in Same Box
    # -----------------------------------------

    next_task = (
        db.query(PickTask)
        .filter(
            PickTask.location == task.location,
            PickTask.box == task.box,
            PickTask.status == "PENDING"
        )
        .order_by(PickTask.sequence)
        .first()
    )

    if next_task:

        return {

            "success": True,

            "task_completed": task.status == "COMPLETED",

            "box_completed": False,

            "location_completed": False,

            "task": {

                "task_id": next_task.id,

                "sku": next_task.sku,

                "required_qty": next_task.required_qty,

                "picked_qty": next_task.picked_qty,

                "remaining_qty": next_task.required_qty - next_task.picked_qty

            }

        }

    # -----------------------------------------
    # Find Next Box in Same Location
    # -----------------------------------------

    next_box = (
        db.query(PickTask)
        .filter(
            PickTask.location == task.location,
            PickTask.status == "PENDING"
        )
        .order_by(
            PickTask.box,
            PickTask.sequence
        )
        .first()
    )

    if next_box:

        return {

            "success": True,

            "task_completed": True,

            "box_completed": True,

            "location_completed": False,

            "next_box": {

                "box": next_box.box,

                "task_id": next_box.id,

                "sku": next_box.sku,

                "required_qty": next_box.required_qty,

                "picked_qty": next_box.picked_qty

            }

        }

    # -----------------------------------------
    # Location Completed
    # -----------------------------------------

    return {

        "success": True,

        "task_completed": True,

        "box_completed": True,

        "location_completed": True,

        "message": "Location Completed"

    }
from pydantic import BaseModel

class RFScan(BaseModel):
    task_id: int
    location: str
    box: str
    serial: str


@router.post("/rf/scan")
def rf_scan(
    data: RFScan,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    task = db.query(PickTask).filter(
        PickTask.id == data.task_id
    ).first()

    if not task:
        raise HTTPException(404, "Task Not Found")

    if task.location.strip().upper() != data.location.strip().upper():
        raise HTTPException(
            400,
            f"Wrong Location. Expected {task.location}"
        )

    if task.box.strip().upper() != data.box.strip().upper():
        raise HTTPException(
            400,
            f"Wrong Box. Expected {task.box}"
        )

    serial = (
        db.query(PickSerial)
        .filter(
            PickSerial.task_id == task.id,
            PickSerial.serial_no == data.serial,
            PickSerial.status == "PENDING"
        )
        .first()
    )

    if not serial:
        raise HTTPException(
            400,
            "Invalid Serial"
        )

    serial.status = "PICKED"

    inventory = (
        db.query(Inventory)
        .filter(Inventory.serial_no == data.serial)
        .first()
    )

    if inventory:
        inventory.status = "PICKED"

    task.picked_qty += 1

    if task.picked_qty >= task.required_qty:
        task.status = "COMPLETED"

    db.commit()

    return {
        "success": True,
        "message": "Pick Completed"
    }