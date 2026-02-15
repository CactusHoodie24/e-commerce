import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext'
import { usePayment } from '../../Context/paymentContext'
import { useToast } from '../../Context/ToastContext'

const FoodItem = ({id,name,price,description,image}) => {

    
    const {cartItems,addToCart,removeFromCart} = useContext(StoreContext);
    const { state: paymentState } = usePayment();
    const { addToast } = useToast();
    
    // Safety check: ensure cartItems[id] is always a number
    const getQuantity = () => {
      const item = cartItems[id];
      if (typeof item === 'number') return item;
      if (typeof item === 'object' && item !== null && 'quantity' in item) return item.quantity;
      return 0;
    };
    
    const quantity = getQuantity();

    // Check if payment is pending (not confirmed as success)
    const isPaymentPending = paymentState.status === "PROCESSING" || 
                            paymentState.status === "SUBMITTING" || 
                            paymentState.status === "CREATED_LOCAL" || 
                            paymentState.status === "RECONCILE_PROCESSING";

    // Handle add to cart with payment check
    const handleAddToCart = () => {
      if (isPaymentPending) {
        addToast("Please wait for your current payment to be confirmed before adding items to cart", "warning", 5000);
        return;
      }
      addToCart(id);
    };
    
  return (
    <div className='food-item'>
    <div className='food-item-img-container'>
    <img className='food-item-image' src={image} alt='' />
    {!quantity
    ?<img className='add' onClick={handleAddToCart} src={assets.add_icon_white} alt='' />
    :<div className='food-item-counter'>
    <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt='' />
    <p>{quantity}</p>
    <img onClick={handleAddToCart} src={assets.add_icon_green} alt='' />

    </div>


    }
    </div>
    <div className='food-item-info'>
        <div className='food-item-name-rating'>
            <p>{name}</p>
            <img src={assets.rating_starts} alt='' />
        </div>
        <p className='food-item-desc'>{description}</p>
        <p className='food-item-price'>${price}</p>
    </div>
    </div>
  )
}

export default FoodItem