import { Outlet } from "react-router-dom";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";

export default function MembersLayout() {
    return (
        <div>
            <Header />
            <Outlet />
            <Footer />
        </div>
    );
}