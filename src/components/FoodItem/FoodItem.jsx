import React, { useContext } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext'

const FoodItem = ({id,name,price,description,image}) => {

    
    const {cartItems,addToCart,removeFromCart} = useContext(StoreContext);
    
    // Safety check: ensure cartItems[id] is always a number
    const getQuantity = () => {
      const item = cartItems[id];
      if (typeof item === 'number') return item;
      if (typeof item === 'object' && item !== null && 'quantity' in item) return item.quantity;
      return 0;
    };
    
    const quantity = getQuantity();
    
  return (
    <div className='food-item'>
    <div className='food-item-img-container'>
    <img className='food-item-image' src={image} alt='' />
    {!quantity
    ?<img className='add' onClick={()=>addToCart(id)} src={assets.add_icon_white} alt='' />
    :<div className='food-item-counter'>
    <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt='' />
    <p>{quantity}</p>
    <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt='' />

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