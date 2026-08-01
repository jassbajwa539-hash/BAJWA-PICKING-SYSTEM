from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.pick_tasks import PickTask
from app.auth.dependencies import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/rf/location")
def get_next_location(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    # --------------------------------------------------
    # Find first pending location
    # --------------------------------------------------

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
            "message": "No Pending Locations"
        }

    current_location = first_task.location

    # --------------------------------------------------
    # Load ALL tasks of same location
    # --------------------------------------------------

    tasks = (
        db.query(PickTask)
        .filter(
            PickTask.location == current_location,
            PickTask.status == "PENDING"
        )
        .order_by(
            PickTask.box,
            PickTask.sku,
            PickTask.sequence
        )
        .all()
    )

    boxes = OrderedDict()

    total_serials = 0

    for task in tasks:

        if task.box not in boxes:
            boxes[task.box] = []

        boxes[task.box].append({

            "task_id": task.id,

            "order_no": task.order_no,

            "sku": task.sku,

            "required_qty": task.required_qty,

            "picked_qty": task.picked_qty,

            "status": task.status

        })

        total_serials += (
            task.required_qty - task.picked_qty
        )

    return {

        "location": current_location,

        "total_boxes": len(boxes),

        "total_tasks": len(tasks),

        "total_serials": total_serials,

        "boxes": boxes,

        "picker": current_user["username"]

    }