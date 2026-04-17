import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Home from "./features/Home/Home";
import CreateMembers from "./features/Members/CreateMembers";
import MemberPage from "./features/Members/Member";
import Members from "./features/Members/Members";
import UpdateMember from "./features/Members/UpdateMember";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/members",
    element: <Members />,
  },
  {
    path: "/members/create",
    element: <CreateMembers />,
  },
  {
    path: "/members/:memberId",
    element: <MemberPage />,
  },
  {
    path: "/members/:memberId/edit",
    element: <UpdateMember />,
  },
]);

export function jagozRouter() {
  const container = document.getElementById("container");
  if (!container) {
    console.error('Root container with id "container" not found in DOM');
    return;
  }

  createRoot(container).render(<RouterProvider router={router} />);
}
