import { createBrowserRouter, RouterProvider} from "react-router-dom";
import {createRoot} from 'react-dom/client'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
]);

export function jagozRouter() {
    const container = document.getElementById("container");
    if (!container) {
        // Caso index.html não seja carregado, div "container" não existirá
        console.error('Root container with id "container" not found in DOM');
        return;
    }

    createRoot(container).render(
        <RouterProvider router={router} />
    )
}