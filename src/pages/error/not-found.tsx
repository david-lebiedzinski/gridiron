import { Link } from "react-router-dom";
import { ERROR } from "@/locales/en";

export default function NotFoundPage() {
  return (
    <div className="error-page">
      <div className="error-icon">{ERROR.notFoundIcon}</div>
      <div className="error-code">404</div>
      <div className="error-title">{ERROR.notFoundTitle}</div>
      <div className="error-body">{ERROR.notFoundBody}</div>
      <Link to="/" className="error-action">
        {ERROR.backHome}
      </Link>
    </div>
  );
}
