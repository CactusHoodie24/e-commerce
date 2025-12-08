import { createContext, useState, useEffect } from "react";
import { food_list } from "../assets/assets";
import axios from "axios";
import { BACKEND_URL } from "../config/backend";

export const StoreContext = createContext(null);
const backend = BACKEND_URL;

axios.defaults.withCredentials = true; // send cookies automatically

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 🔥 On app load — check if the cookie contains a valid JWT
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${backend}/api/auth/me`);
        setUser(res.data.user); // backend returns user info
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    checkAuth();
  }, []);

  // Persist cart to localStorage for UX only
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setCartItems(JSON.parse(savedCart));
  }, []);

  // 🔥 Sync cart with DB after user login
  useEffect(() => {
    if (!user) return;

    const syncCart = async () => {
      try {
        const res = await axios.get(`${backend}/api/cart/${user.id}`);
        // Convert backend array format [{itemId, quantity}, ...] to frontend object format {itemId: quantity}
        const dbCartArray = res.data.items || [];
        const dbCart = dbCartArray.reduce((acc, item) => {
          acc[item.itemId] = item.quantity;
          return acc;
        }, {});

        // merge local + remote (frontend format takes precedence)
        const mergedCart = { ...dbCart, ...cartItems };

        // Calculate total amount from merged cart
        const totalAmount = Object.entries(mergedCart).reduce((total, [id, qty]) => {
          const item = food_list.find(p => p._id === id);
          return item ? total + item.price * qty : total;
        }, 0);

        setCartItems(mergedCart);

        // save merged cart to DB
        await axios.post(`${backend}/api/cart/${user.id}`, { 
          items: mergedCart,
          totalamount: totalAmount,
          currency: "MWK"
        });
      } catch (err) {
        console.error("Cart sync error", err);
      }
    };

    syncCart();
  }, [user]);

  // 🔥 Update both state + backend if logged in
  const updateCart = async (newCart) => {
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
    updateCart({
      ...cartItems,
      [itemId]: (cartItems[itemId] || 0) + 1
    });
  };

  const removeFromCart = (itemId) => {
    updateCart({
      ...cartItems,
      [itemId]: Math.max((cartItems[itemId] || 0) - 1, 0)
    });
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
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    user,
    setUser,
    loadingUser
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
