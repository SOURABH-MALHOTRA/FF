import { useEffect } from "react";
import { CheckCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate(); // Corrected for React Router

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
        <CheckCircle className="text-green-500 dark:text-green-400 w-16 h-16 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">
          Order Placed Successfully!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Thank you for shopping with us. Your order will be processed soon.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate("/")} // Corrected navigation
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
