import React from 'react'
import './Cart.css'
import { useContext } from 'react'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
axios.defaults.withCredentials = true;
import PaymentForm from '../../components/Payment/PaymentForm'
import { BACKEND_URL } from '../../config/backend'

const Cart = () => {
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);

  const { cartItems, food_list, removeFromCart, getTotalCartAmount, user } =
    useContext(StoreContext);

  const navigate = useNavigate();
  const backend = BACKEND_URL;

  // ----------------------------------------
  // CHECKOUT LOGIC — SAVE CART ONLY!
  // ----------------------------------------
  const checkoutCart = async () => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }

    const itemsToSave = Object.fromEntries(
      Object.entries(cartItems).filter(([_, qty]) => qty > 0)
    );

    if (Object.keys(itemsToSave).length === 0) {
      console.log("No items in cart.");
      return;
    }

    try {
      // Save cart inside MongoDB
      const payload = {
        items: itemsToSave,
        totalamount: getTotalCartAmount() + 2,
        currency: "MWK"
      };

      // Log payload sent to backend for debugging
      console.log('Cart payload ->', payload);

      const saveRes = await axios.post(`${backend}/api/cart/${user.id}`, payload);

      console.log("Cart saved:", saveRes.data);

      // ⛔ DO NOT PROCESS PAYMENT HERE!
      // JUST OPEN PAYMENT FORM
      setShowPaymentForm(true);

    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="cart">

      {/* ITEMS */}
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />

        {food_list.map((item) => {
          // Safety check: ensure cartItems[item._id] is always a number
          const cartItem = cartItems[item._id];
          const quantity = typeof cartItem === 'number' 
            ? cartItem 
            : (typeof cartItem === 'object' && cartItem !== null && 'quantity' in cartItem) 
              ? cartItem.quantity 
              : 0;
              
          if (quantity > 0) {
            return (
              <div key={item._id} className="cart-items-title cart-items-item">
                <img src={item.image} alt="" />
                <p>{item.name}</p>
                <p>{item.price}</p>
                <p>{quantity}</p>
                <p>{item.price * quantity}</p>
                <p onClick={() => removeFromCart(item._id)} className="cross">
                  x
                </p>
              </div>
            );
          }
        })}
      </div>

      {/* BOTTOM OR PAYMENT FORM */}
      {!showPaymentForm ? (
        <div className="cart-bottom">
          <div className="cart-total">
            <h2>Cart totals</h2>

            <div>
              <div className="cart-total-details">
                <p>Subtotal</p>
                <p>{getTotalCartAmount()}</p>
              </div>
              <hr />

              <div className="cart-total-details">
                <p>Delivery Fee</p>
                <p>2</p>
              </div>
              <hr />

              <div className="cart-total-details">
                <p>Total</p>
                <p>{getTotalCartAmount() + 2}</p>
              </div>
            </div>

            <button onClick={checkoutCart}>
              PROCEED TO CHECKOUT
            </button>
          </div>

          <div className="cart-promocode">
            <div>
              <p>If you have a promo code, Enter it here</p>
              <div className="cart-promocode-input">
                <input type="text" placeholder="promo code" />
                <button>Submit</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PASS REQUIRED DETAILS TO PAYMENT FORM */
        <PaymentForm
          user={user}
          amount={getTotalCartAmount() + 2}
          currency="MWK"
          onSuccess={() => navigate("/payment-processing")}
        />
      )}
    </div>
  );
};

export default Cart;
