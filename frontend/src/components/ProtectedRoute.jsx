import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    // If no user, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, show protected content
    return children;
};

export default ProtectedRoute;
