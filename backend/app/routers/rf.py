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