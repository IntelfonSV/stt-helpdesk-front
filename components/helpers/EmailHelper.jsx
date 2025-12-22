const EmailHelper =  () =>{

  const emailContent = (data) => {
    return `
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
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado por: ${data.asignBy || 'N/A'}</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${data.asignBy || 'N/A'}</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asignado a:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${data.assignTo || 'N/A'}</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Fecha de entrega:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #E31E24; font-weight: bold; font-size: 14px; vertical-align: top;">${data.dueDate ? new Date(data.dueDate).toLocaleDateString('es-ES') : 'N/A'}</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Hora de entrega:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #E31E24; font-weight: bold; font-size: 14px; vertical-align: top;">${data.dueDate ? new Date(data.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                </div>
              </div>
              
              <div style="border-bottom: 1px solid #eeeeee;">
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Asunto:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top;">${data.subject || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <div style="display: flex;">
                  <div style="width: 35%; padding: 12px 20px; background-color: #fafafa; color: #666666; font-weight: bold; font-size: 14px; vertical-align: top;">Descripción:</div>
                  <div style="width: 65%; padding: 12px 20px; color: #1F2937; font-size: 14px; vertical-align: top; line-height: 1.5;">${data.description || 'N/A'}</div>
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
  }

  return {
    emailContent
  }
}


export default EmailHelper;
