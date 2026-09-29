import { permanentRedirect } from "next/navigation";

// Recursos se convirtió en el gestor de contraseñas; los enlaces antiguos siguen funcionando.
export default function ResourcesPage() {
  permanentRedirect("/contrasenas");
}
