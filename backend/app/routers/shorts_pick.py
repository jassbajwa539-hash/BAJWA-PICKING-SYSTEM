from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.pick_tasks import PickTask
from app.models.short_pick import ShortPick
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["Short Pick"])


# ============================================================================
# 1. REQUEST SCHEMA
# ============================================================================
class ShortPickRequest(BaseModel):
    task_id: int
    reason: str
    remarks: Optional[str] = None


# ============================================================================
# 2. DATABASE DEPENDENCY
# ============================================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# 3. CREATE SHORT PICK API ENDPOINT
# ============================================================================
@router.post("/rf/short-pick")
def create_short_pick(
    request: ShortPickRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Step 2.4: Load Task
    task = db.query(PickTask).filter(PickTask.id == request.task_id).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Prevent short picking an already completed task
    status_completed = getattr(PickTask, "STATUS_COMPLETED", "COMPLETED")
    if task.status == status_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task already completed",
        )

    # Step 2.5: Prevent Duplicate Short Pick
    existing = (
        db.query(ShortPick).filter(ShortPick.task_id == task.id).first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Short Pick already created",
        )

    # Step 2.6: Calculate Quantities (Backend-computed)
    required_qty = task.required_qty
    picked_qty = task.picked_qty
    short_qty = required_qty - picked_qty

    if short_qty <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to short pick",
        )

    # Extract picker username safely
    picker_username = (
        current_user["username"]
        if isinstance(current_user, dict)
        else getattr(current_user, "username", "Operator")
    )

    # Step 2.7: Save Short Pick Audit Record
    short = ShortPick(
        task_id=task.id,
        order_no=task.order_no,
        sku=task.sku,
        location=task.location,
        box=task.box,
        required_qty=required_qty,
        picked_qty=picked_qty,
        short_qty=short_qty,
        reason=request.reason,
        remarks=request.remarks,
        picker=picker_username,
    )
    db.add(short)

    # Update Task Status
    status_short = getattr(PickTask, "STATUS_SHORT", "SHORT")
    task.status = status_short

    # Step 2.9: Commit Transaction
    db.commit()

    # ========================================================================
    # Determine Next RF Picking State (Fixed Flow Progression)
    # ========================================================================
    status_pending = getattr(PickTask, "STATUS_PENDING", "PENDING")

    # Fetch the next pending task in this location ordered deterministically
    next_task = (
        db.query(PickTask)
        .filter(
            PickTask.location == task.location,
            PickTask.status == status_pending,
            PickTask.id != task.id,
        )
        .order_by(PickTask.id.asc())
        .first()
    )

    box_completed = False
    next_box = None
    location_completed = False

    if next_task:
        # Helper dictionary for next task state
        task_payload = {
            "id": next_task.id,
            "box": next_task.box,
            "sku": next_task.sku,
            "required_qty": next_task.required_qty,
            "picked_qty": next_task.picked_qty,
            "remaining_qty": max(next_task.required_qty - next_task.picked_qty, 0),
        }

        if next_task.box != task.box:
            # Moving to a new box
            box_completed = True
            next_box = task_payload
        else:
            # Continuing in the same box with a new SKU
            box_completed = False
    else:
        # No remaining pending tasks in this location -> Entire Location Complete
        location_completed = True

    # Step 2.10: Return Progression Payload for RF Screen
    return {
        "success": True,
        "message": "Short Pick Created",
        "short_qty": short_qty,
        "task_completed": True,
        "box_completed": box_completed,
        "location_completed": location_completed,
        "next_box": next_box,
        "task": {
            "id": next_task.id,
            "sku": next_task.sku,
            "required_qty": next_task.required_qty,
            "picked_qty": next_task.picked_qty,
            "remaining_qty": max(next_task.required_qty - next_task.picked_qty, 0),
        }
        if next_task and not box_completed and not location_completed
        else None,
    }