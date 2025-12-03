import { createContext, useState, useEffect } from "react";
import { food_list } from "../assets/assets";
import { jwtDecode } from 'jwt-decode';
import axios from "axios";

export const StoreContext = createContext(null);
const backend = "http://localhost:5000";

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [user, setUser] = useState(null);

  // On app load, check localStorage for token and cart
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const data = localStorage.getItem("user");
    const savedCart = localStorage.getItem("cartItems");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token", err);
        setUser(data ? JSON.parse(data) : null);
      }
    } else if (data) {
      setUser(JSON.parse(data));
    }

    if (savedCart) setCartItems(JSON.parse(savedCart));
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync cart with DB when user logs in
useEffect(() => {
  const syncCartWithDB = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${backend}/api/cart/${user.id}`);
      const dbCart = (res.data?.items || []).reduce((acc, item) => {
        acc[item.itemId] = item.quantity;
        return acc;
      }, {});

      // Merge DB cart with local cart
      const mergedCart = { ...dbCart, ...cartItems };

      // Keep only valid MongoDB ObjectIds
      const filteredCart = Object.fromEntries(
        Object.entries(mergedCart).filter(([key, qty]) =>
          /^[0-9a-fA-F]{24}$/.test(key)
        )
      );

      console.log("Updating cart with:", filteredCart);

      setCartItems(filteredCart);

      // Update DB with filtered cart
      await axios.post(`${backend}/api/cart/${user.id}`, { items: filteredCart });
    } catch (err) {
      console.error("Cart sync error", err);
    }
  };

  syncCartWithDB();
}, [user]);


  // Utility to update both state and backend
  const updateCart = async (newCart) => {
      console.log("Updating cart with:", newCart); // <--- debug
    setCartItems(newCart);

    if (user) {
      try {
        await axios.post(`${backend}/api/cart/${user.id}`, { items: newCart });
      } catch (err) {
        console.error("Cart update error:", err);
      }
    }
  };

 const addToCart = (itemId) => {
  setCartItems(prev => ({
    ...prev,
    [itemId]: (prev[itemId] || 0) + 1
  }));
};

const removeFromCart = (itemId) => {
  setCartItems(prev => ({
    ...prev,
    [itemId]: Math.max((prev[itemId] || 0) - 1, 0)
  }));
};



  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [id, qty]) => {
      const item = food_list.find(p => p._id === id);
      return item ? total + item.price * qty : total;
    }, 0);
  };

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    user,
    setUser,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
