import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Acerca de</CardTitle>
          <CardDescription>Información sobre el sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sobre el sistema</h3>
            <p>
              Este sistema de Odontología Pediátrica está diseñado para optimizar la gestión de pacientes, historiales
              clínicos y citas médicas en consultorios especializados en la atención infantil. Su interfaz intuitiva y
              herramientas avanzadas facilitan el trabajo de los profesionales de la salud, mejorando la experiencia
              tanto para médicos como para pacientes.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Características principales</h3>
            <ul className="list-disc list-inside">
              <li>Registro y gestión de pacientes pediátricos</li>
              <li>Historial clínico detallado y seguro</li>
              <li>Programación y administración de citas</li>
              <li>Interfaz amigable y adaptada para uso profesional</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Licencia y uso</h3>
            <p>
              Este software está disponible bajo la licencia Creative Commons Atribución-NoComercial 4.0 Internacional
              (CC BY-NC 4.0). Esto significa que puedes:
            </p>
            <ul className="list-disc list-inside">
              <li>Usarlo y compartirlo libremente</li>
              <li>Modificarlo y adaptarlo a tus necesidades</li>
              <li>No utilizarlo con fines comerciales sin autorización</li>
              <li>Respetar la atribución al creador original</li>
            </ul>
            <p>
              Para más información sobre esta licencia, visita:{" "}
              <a
                href="https://creativecommons.org/licenses/by-nc/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                https://creativecommons.org/licenses/by-nc/4.0/
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <p>
              Para dudas, sugerencias o consultas, puedes escribirnos a:
              <br />
              <a href="mailto:lehabimgroup@gmail.com" className="text-blue-500 hover:underline">
                lehabimgroup@gmail.com
              </a>
            </p>
            <p className="text-blue-500">By. Lehabim Cruz</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
