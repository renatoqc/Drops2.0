function CartIcon({ itemCount, onClick }) {
  return (
    <div className="cart-icon" onClick={onClick}>
      CARRITO
      {itemCount > 0 && (
        <span className="cart-badge">{itemCount}</span>
      )}
    </div>
  );
}

export default CartIcon;

