from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def load_available_inventory(db: Session):
    """
    Load all available inventory in warehouse travel order.

    Sorting:
        Location
            ↓
        Box
            ↓
        SKU
            ↓
        Serial
    """

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.status == "AVAILABLE"
        )
        .order_by(
            Inventory.location,
            Inventory.box,
            Inventory.sku,
            Inventory.serial_no
        )
        .all()
    )

    return inventory