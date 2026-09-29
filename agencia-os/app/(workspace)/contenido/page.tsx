import { permanentRedirect } from "next/navigation";

// Contenido vive ahora dentro de la Agenda; los enlaces antiguos siguen funcionando.
export default function ContentPage() {
  permanentRedirect("/agenda?vista=contenido");
}
