from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class ShortPick(Base):
    __tablename__ = "short_picks"

    # Core Event Fields
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, index=True, nullable=True)
    order_no = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=False)
    location = Column(String, index=True, nullable=False)
    box = Column(String, nullable=False)
    
    # Quantities
    required_qty = Column(Integer, nullable=False)
    picked_qty = Column(Integer, nullable=False)
    short_qty = Column(Integer, nullable=False)  # Computed strictly on backend
    
    # Exception Details
    reason = Column(String, nullable=False)
    picker = Column(String, index=True, nullable=False)
    status = Column(String, default="PENDING", index=True, nullable=False)  # PENDING, APPROVED, REJECTED, REALLOCATED
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Supervisor Resolution Audit (Populated when resolved)
    remarks = Column(String, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)