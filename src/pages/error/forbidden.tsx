import { Link } from "react-router-dom";
import { ERROR } from "@/locales/en";

export default function ForbiddenPage() {
  return (
    <div className="error-page">
      <div className="error-icon">{ERROR.forbiddenIcon}</div>
      <div className="error-code">403</div>
      <div className="error-title">{ERROR.forbiddenTitle}</div>
      <div className="error-body">{ERROR.forbiddenBody}</div>
      <Link to="/" className="error-action">
        {ERROR.backHome}
      </Link>
    </div>
  );
}
