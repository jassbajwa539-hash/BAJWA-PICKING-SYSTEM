@router.delete("/admin/reset")
def reset_database(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN"))
):
    db.query(PickSerial).delete()
    db.query(PickTask).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(Inventory).delete()

    db.commit()

    return {
        "message": "Database reset successfully."
    }