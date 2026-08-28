import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MainNav } from "@/components/navigation";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNav />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="inline-block p-4 rounded-full bg-[#6654f5]/10 mb-4 text-[#6654f5] text-5xl font-black">
            404
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Page not found</h1>
          <p className="text-gray-600 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Button asChild className="brand-gradient text-white rounded-full px-6 py-3">
            <Link to="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
