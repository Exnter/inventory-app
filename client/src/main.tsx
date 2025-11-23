import React from 'react'
import ReactDOM from 'react-dom/client'
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import PrintView from './components/PrintView';
import './index.css'; // Standard CSS reset if needed, otherwise optional

const router = createBrowserRouter([
  {
    path: "/:code?",
    element: <App />,
  },
  {
    path: "/print",
    element: <PrintView />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
        <RouterProvider router={router} />
    </FluentProvider>
  </React.StrictMode>,
)