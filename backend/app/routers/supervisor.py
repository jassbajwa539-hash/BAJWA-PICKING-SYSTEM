from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal
from app.models.pick_tasks import PickTask
from app.models.short_pick import ShortPick

router = APIRouter(prefix="/supervisor", tags=["Supervisor Approval"])


# ----------------------------------------------------
# DB DEPENDENCY
# ----------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------------------------------------
# REQUEST SCHEMAS
# ----------------------------------------------------
class ShortPickActionRequest(BaseModel):
    id: int
    remarks: Optional[str] = "Resolved"


class ReallocateRequest(BaseModel):
    id: int
    new_location: Optional[str] = None
    new_box: Optional[str] = None
    remarks: Optional[str] = "Reallocated"


# ----------------------------------------------------
# 1. GET SHORT PICKS LIST WITH FILTERS
# ----------------------------------------------------
@router.get("/short-picks")
def get_short_picks(
    order_no: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    picker: Optional[str] = Query(None),
    reason: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(ShortPick)

    if order_no:
        query = query.filter(ShortPick.order_no.ilike(f"%{order_no.strip()}%"))
    if sku:
        query = query.filter(ShortPick.sku.ilike(f"%{sku.strip()}%"))
    if picker:
        query = query.filter(ShortPick.picker.ilike(f"%{picker.strip()}%"))
    if reason:
        query = query.filter(ShortPick.reason == reason)
    if status_filter:
        query = query.filter(ShortPick.status == status_filter)

    records = query.order_by(desc(ShortPick.created_at)).all()

    return [
        {
            "id": item.id,
            "order_no": item.order_no,
            "sku": item.sku,
            "location": item.location,
            "box": item.box,
            "required_qty": item.required_qty,
            "picked_qty": item.picked_qty,
            "short_qty": item.short_qty,
            "reason": item.reason,
            "remarks": item.remarks,
            "picker": item.picker,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "",
            "resolved_by": item.resolved_by,
            "resolved_at": item.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if item.resolved_at else None,
        }
        for item in records
    ]


# ----------------------------------------------------
# 2. DASHBOARD SUMMARY STATS
# ----------------------------------------------------
@router.get("/stats")
def get_supervisor_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    status_pending = getattr(PickTask, "STATUS_PENDING", "PENDING")
    
    pending_count = db.query(ShortPick).filter(ShortPick.status == "PENDING").count()
    approved_today = (
        db.query(ShortPick)
        .filter(ShortPick.status == "APPROVED", ShortPick.resolved_at >= today_start)
        .count()
    )
    rejected_count = db.query(ShortPick).filter(ShortPick.status == "REJECTED").count()
    reallocated_count = db.query(ShortPick).filter(ShortPick.status == "REALLOCATED").count()

    return {
        "pending": pending_count,
        "approved_today": approved_today,
        "rejected": rejected_count,
        "reallocated": reallocated_count,
    }


# ----------------------------------------------------
# 3. APPROVE SHORT PICK
# ----------------------------------------------------
@router.post("/approve-short-pick")
def approve_short_pick(
    payload: ShortPickActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    short = db.query(ShortPick).filter(ShortPick.id == payload.id).first()
    if not short:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Short pick record not found")

    # Consistent Constant Comparison
    status_pending = getattr(PickTask, "STATUS_PENDING", "PENDING")
    if short.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Record is already resolved")

    supervisor_name = (
        current_user["username"]
        if isinstance(current_user, dict)
        else getattr(current_user, "username", "Supervisor")
    )

    short.status = "APPROVED"
    short.remarks = payload.remarks
    short.resolved_by = supervisor_name
    short.resolved_at = datetime.now()

    db.commit()
    return {"success": True, "message": "Short pick approved successfully", "status": "APPROVED"}


# ----------------------------------------------------
# 4. REJECT SHORT PICK
# ----------------------------------------------------
@router.post("/reject-short-pick")
def reject_short_pick(
    payload: ShortPickActionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    short = db.query(ShortPick).filter(ShortPick.id == payload.id).first()
    if not short:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Short pick record not found")

    if short.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Record is already resolved")

    supervisor_name = (
        current_user["username"]
        if isinstance(current_user, dict)
        else getattr(current_user, "username", "Supervisor")
    )

    short.status = "REJECTED"
    short.remarks = payload.remarks
    short.resolved_by = supervisor_name
    short.resolved_at = datetime.now()

    # Reset task status back to PENDING so the task can be re-attempted
    status_pending = getattr(PickTask, "STATUS_PENDING", "PENDING")
    if short.task_id:
        task = db.query(PickTask).filter(PickTask.id == short.task_id).first()
        if task:
            task.status = status_pending

    db.commit()
    return {"success": True, "message": "Short pick rejected", "status": "REJECTED"}


# ----------------------------------------------------
# 5. REALLOCATE SHORT PICK
# ----------------------------------------------------
@router.post("/reallocate-short-pick")
def reallocate_short_pick(
    payload: ReallocateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    short = db.query(ShortPick).filter(ShortPick.id == payload.id).first()
    if not short:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Short pick record not found")

    if short.status not in ["PENDING", "APPROVED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reallocate this record")

    supervisor_name = (
        current_user["username"]
        if isinstance(current_user, dict)
        else getattr(current_user, "username", "Supervisor")
    )

    # IMPR: Get highest sequence number to append new task at the end of queue
    last_sequence = (
        db.query(func.max(PickTask.sequence))
        .scalar()
        or 0
    )

    status_pending = getattr(PickTask, "STATUS_PENDING", "PENDING")

    # 1. Create a replacement PickTask for the remaining short_qty with sequence
    new_task = PickTask(
        order_no=short.order_no,
        sku=short.sku,
        location=payload.new_location or short.location,
        box=payload.new_box or short.box,
        required_qty=short.short_qty,
        picked_qty=0,
        status=status_pending,
        sequence=last_sequence + 1,  # Keeps task queue ordered
    )
    db.add(new_task)

    # 2. Update Short Pick Record
    short.status = "REALLOCATED"
    short.remarks = payload.remarks
    short.resolved_by = supervisor_name
    short.resolved_at = datetime.now()

    db.commit()

    return {
        "success": True,
        "message": "Short pick reallocated to new task",
        "new_task_id": new_task.id,
        "sequence": new_task.sequence,
        "status": "REALLOCATED",
    }