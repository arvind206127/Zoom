// ✅ Sahi Code (src/utils/withAuth.jsx me)
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        useEffect(() => {
            // 👇 Yahan localStorage ko sessionStorage karein
            if (!sessionStorage.getItem("token")) {
                router("/auth");
            }
        }, []);

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;