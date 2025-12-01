import React, { useContext, useState } from 'react'
import './navbar.css'
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'


const Navbar = ({setShowLogin}) => {

    const [menu,setMenu] = useState("menu");

    const {getTotalCartAmount} = useContext(StoreContext);
  return (
    <div className='navbar'>
    <Link to='./'><img src={assets.logo} alt='' /></Link>
    <ul className='navbar-menu'>
        <Link to='/' onClick={()=>setMenu("home")} className={menu==="home"?"active":""}>home</Link>
        <a href='#explore-menu' onClick={()=>setMenu("menu")} className={menu==="menu"?"active":""}>menu</a>
        <a href='#app-download' onClick={()=>setMenu("mobile_app")} className={menu==="mobile_app"?"active":""}>mobile_app</a>
        <a href='#footer' onClick={()=>setMenu("contact_us")} className={menu==="contact_us"?"active":""}>contact_us</a>
    </ul>
    <div className='navbar-right'>
        <img src={assets.search_icon} alt='' />
        <div className='navbar-search-icon'>
            <Link to='/cart'><img src={assets.basket_icon} alt='' /></Link>
            <div className={getTotalCartAmount()===0?"":"dot"}>
            </div>
        </div>
        <button onClick={()=>setShowLogin(true)}>sign in</button>
    </div>
    </div>
  )
}

export default Navbar