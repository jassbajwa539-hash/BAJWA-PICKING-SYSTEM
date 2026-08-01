from sqlalchemy.orm import Session

from app.models.pick_tasks import PickTask
from app.models.pick_serials import PickSerial

from app.services.inventory_loader import load_available_inventory
from app.services.allocator import allocate_inventory
from app.services.location_group import group_locations
from app.services.task_builder import build_pick_tasks
from app.services.serial_builder import build_pick_serials

from app.models.order_items import OrderItem


def generate_pick_tasks(db: Session):
    """
    Warehouse RF WMS V2

    Flow

    Orders
        ↓
    Inventory
        ↓
    FIFO Allocation
        ↓
    Location Grouping
        ↓
    PickTask Creation
        ↓
    PickSerial Creation
        ↓
    Reserve Inventory
    """

    # -----------------------------------------
    # Remove previous picking
    # -----------------------------------------

    db.query(PickSerial).delete()
    db.query(PickTask).delete()

    db.commit()

    # -----------------------------------------
    # Load Orders
    # -----------------------------------------

    order_items = (
        db.query(OrderItem)
        .all()
    )

    # -----------------------------------------
    # Load Inventory
    # -----------------------------------------

    inventory = load_available_inventory(db)

    # -----------------------------------------
    # FIFO Allocation
    # -----------------------------------------

    allocation, shortages = allocate_inventory(
        order_items,
        inventory
    )

    # -----------------------------------------
    # Group Warehouse
    # -----------------------------------------

    locations = group_locations(
        allocation
    )

    # -----------------------------------------
    # Create Pick Tasks
    # -----------------------------------------

    task_map = build_pick_tasks(
        db,
        locations
    )

    # -----------------------------------------
    # Create Pick Serials
    # -----------------------------------------

    result = build_pick_serials(
        db,
        task_map
    )

    # -----------------------------------------
    # Final Result
    # -----------------------------------------

    return {

        "success": True,

        "locations": len(locations),

        "tasks_created": len(task_map),

        "serials_created": result["serials_created"],

        "inventory_reserved": result["inventory_reserved"],

        "shortages": shortages

    }