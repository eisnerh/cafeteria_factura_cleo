import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1>Página no encontrada</h1>
        <p>La ruta que buscas no existe o fue movida.</p>
        <Link to="/" className="btn primary">Volver al inicio</Link>
      </div>
    </div>
  );
}
