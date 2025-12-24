const EmailHelper = () => {
  const emailAsignado = (data) => {
    const ingresado = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 40px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Logo -->
          <div style="text-align: center; padding: 30px 20px;">
            <img src="https://grupostt.com/wp-content/uploads/2025/06/LogoSTT.png" width="180" alt="Logo STT" style="display: block; margin: 0 auto; width: 180px; height: auto;">
          </div>
          
          <!-- Header -->
          <div style="background-color: #E31E24; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Nuevo Ticket Asignado</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #1F2937;">
              Se ha ingresado un nuevo ticket en el sistema que requiere su atención.
            </p>
            
            <!-- Info Table -->
            <div style="border: 1px solid #dddddd; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
              <!-- Table Header -->
              <div style="background-color: #1F2937; padding: 12px 20px; border-bottom: 1px solid #1F2937;">
                <h3 style="margin: 0; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">INFORMACIÓN DE LA ASIGNACIÓN</h3>
              </div>
              
              <!-- Data Rows -->
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado por: ${
                    data.asignBy || "N/A"
                  }</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.asignBy || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado a:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.assignTo || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Fecha de entrega:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #E31E24; font-weight: bold; font-size: 14px; vertical-align: top;">${
                    data.dueDate
                      ? new Date(data.dueDate).toLocaleDateString("es-ES")
                      : "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Hora de entrega:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #E31E24; font-weight: bold; font-size: 14px; vertical-align: top;">${
                    data.dueDate
                      ? new Date(data.dueDate).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asunto:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.subject || "N/A"
                  }</div>
                </div>
              </div>
              
              <div>
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Descripción:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; line-height: 1.5;">${
                    data.description || "N/A"
                  }</div>
                </div>
              </div>
            </div>
            
            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666; font-style: italic;">
              Por favor, ingrese al sistema para gestionar esta solicitud a la brevedad posible.
            </p>
          </div>
        </div>
      </div>
    `;
    return ingresado;
  };

  const emailSeguimiento = (data) => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 40px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Logo -->
          <div style="text-align: center; padding: 30px 20px;">
            <img src="https://grupostt.com/wp-content/uploads/2025/06/LogoSTT.png" width="180" alt="Logo STT" style="display: block; margin: 0 auto; width: 180px; height: auto;">
          </div>
          
          <!-- Header -->
          <div style="background-color: #E31E24; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Seguimiento de Ticket</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #1F2937;">
              Se informa que se le está dando seguimiento al siguiente ticket con los detalles actualizados a continuación:
            </p>
            
            <!-- Info Table -->
            <div style="border: 1px solid #dddddd; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
              <!-- Table Header -->
              <div style="background-color: #1F2937; padding: 12px 20px; border-bottom: 1px solid #1F2937;">
                <h3 style="margin: 0; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">DETALLES DEL SEGUIMIENTO</h3>
              </div>
              
              <!-- Data Rows -->
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado por:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.asignBy || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado a:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.assignTo || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Correlativo:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; font-weight: bold;">${
                    data.correlativo || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Fecha seguimiento:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.fechaSeguimiento ? new Date(data.fechaSeguimiento).toLocaleDateString('es-ES') : "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Estado:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">
                    <span style="background-color: #fef2f2; color: #E31E24; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid #fee2e2;">
                      ${data.estado || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asunto:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.subject || "N/A"
                  }</div>
                </div>
              </div>
              
              <div>
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Acción Realizada:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; line-height: 1.5;">${
                    data.accionRealizada || "N/A"
                  }</div>
                </div>
              </div>
            </div>
            
            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666; font-style: italic;">
              Para más información sobre el progreso de esta solicitud, puede consultar el historial completo en el sistema.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  const emailFinalizado = (data) => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 40px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Logo -->
          <div style="text-align: center; padding: 30px 20px;">
            <img src="https://grupostt.com/wp-content/uploads/2025/06/LogoSTT.png" width="180" alt="Logo STT" style="display: block; margin: 0 auto; width: 180px; height: auto;">
          </div>
          
          <!-- Header -->
          <div style="background-color: #1F2937; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Ticket Finalizado</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #1F2937;">
              Le informamos que el proceso de atención para su ticket ha concluido exitosamente. El ticket ha sido marcado como <strong>Finalizado</strong>.
            </p>
            
            <!-- Info Table -->
            <div style="border: 1px solid #dddddd; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
              <!-- Table Header -->
              <div style="background-color: #E31E24; padding: 12px 20px; border-bottom: 1px solid #E31E24;">
                <h3 style="margin: 0; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">RESUMEN DE CIERRE</h3>
              </div>
              
              <!-- Data Rows -->
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Correlativo:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; font-weight: bold;">${
                    data.correlativo || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado por:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.asignBy || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Finalizado por:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.finalizadoPor || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Fecha de cierre:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.fechaCierre ? new Date(data.fechaCierre).toLocaleDateString('es-ES') : "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Días de atraso:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #E31E24; font-size: 14px; vertical-align: top; font-weight: bold;">${
                    data.diasAtraso || "0"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Estado:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">
                    <span style="background-color: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid #d1fae5;">
                      FINALIZADO
                    </span>
                  </div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asunto:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.subject || "N/A"
                  }</div>
                </div>
              </div>
              
              <div>
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Resolución final:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; line-height: 1.5;">${
                    data.resolucion || "N/A"
                  }</div>
                </div>
              </div>
            </div>
            
            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666; font-style: italic;">
              Gracias por su paciencia durante este proceso. Si tiene alguna duda adicional, puede abrir un nuevo ticket de consulta.
            </p>
          </div>
        </div>
      </div>
    `;
  }


  const emailCancelado = (data) => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 40px 15px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Logo -->
          <div style="text-align: center; padding: 30px 20px;">
            <img src="https://grupostt.com/wp-content/uploads/2025/06/LogoSTT.png" width="180" alt="Logo STT" style="display: block; margin: 0 auto; width: 180px; height: auto;">
          </div>
          
          <!-- Header -->
          <div style="background-color: #6B7280; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Ticket Cancelado</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #1F2937;">
              Le informamos que el ticket ha sido cancelado y no continuará en proceso de atención.
            </p>
            
            <!-- Info Table -->
            <div style="border: 1px solid #dddddd; border-radius: 6px; overflow: hidden; margin-bottom: 30px;">
              <!-- Table Header -->
              <div style="background-color: #6B7280; padding: 12px 20px; border-bottom: 1px solid #6B7280;">
                <h3 style="margin: 0; font-size: 14px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">DETALLES DE CANCELACIÓN</h3>
              </div>
              
              <!-- Data Rows -->
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Correlativo:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; font-weight: bold;">${
                    data.correlativo || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Solicitado por:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.asignBy || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Cancelado por:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.canceladoPor || "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Fecha de cancelación:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.fechaCancelacion ? new Date(data.fechaCancelacion).toLocaleDateString('es-ES') : "N/A"
                  }</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Estado:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">
                    <span style="background-color: #f3f4f6; color: #6B7280; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid #e5e7eb;">
                      CANCELADO
                    </span>
                  </div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asunto:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${
                    data.subject || "N/A"
                  }</div>
                </div>
              </div>
              
              <div>
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Motivo de cancelación:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; line-height: 1.5;">${
                    data.motivoCancelacion || "No especificado"
                  }</div>
                </div>
              </div>
            </div>
            
            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666; font-style: italic;">
              Si considera que esta cancelación fue un error o necesita abrir una nueva solicitud, puede comunicarse con el administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  return {
    emailAsignado,
    emailSeguimiento,
    emailFinalizado,
    emailCancelado
  };
};

export default EmailHelper;
