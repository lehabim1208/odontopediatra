export default function AcercaDeMovilPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">Acerca de</h1>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 md:p-6">
          <h2 className="text-xl font-semibold text-primary mb-2">Información del Sistema</h2>
          <p className="text-muted-foreground text-sm mb-4">Detalles sobre el sistema de gestión dental</p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Sobre el sistema</h3>
              <p className="text-sm">
                Este sistema de Odontología Pediátrica está diseñado para optimizar la gestión de pacientes, historiales
                clínicos y citas médicas en consultorios especializados en la atención infantil. Su interfaz intuitiva y
                herramientas avanzadas facilitan el trabajo de los profesionales de la salud, mejorando la experiencia
                tanto para médicos como para pacientes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Características principales</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Registro y gestión de pacientes pediátricos</li>
                <li>Historial clínico detallado y seguro</li>
                <li>Programación y administración de citas</li>
                <li>Interfaz amigable y adaptada para uso profesional</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Licencia y uso</h3>
              <p className="text-sm mb-2">
                Este software está disponible bajo la licencia Creative Commons Atribución-NoComercial 4.0 Internacional
                (CC BY-NC 4.0). Esto significa que puedes:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Usarlo y compartirlo libremente</li>
                <li>Modificarlo y adaptarlo a tus necesidades</li>
                <li>No utilizarlo con fines comerciales sin autorización</li>
                <li>Respetar la atribución al creador original</li>
              </ul>
              <p className="text-sm mt-2">
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
          </div>
        </div>
      </div>
    </div>
  )
}
