import React from 'react'
import './Placeorder.css'

const Placeorder = () => {
  return (
    <form className='place-order'>
<div className='place-order-right'>
  <div className='title'>Delivery Information</div>
  <div className='multi-fields'>
    <input type='text' placeholder='First name' />
<input type='text' placeholder='Last name'/>
  </div>
  <input type='email' placeholder='Email Address' />
  <input type='text' placeholder='Street' />
  <div className='multi-fields'>
    <input type='text' placeholder='City' />
    <input type='text' placeholder='State' />
  </div>
  <div className='multi-fields'>
    <input type='text' placeholder='City' />
    <input type='text' placeholder='State' />
  </div>
  <input type='email' placeholder='Email Address' />
</div>
    </form>
  )
}

export default Placeorder