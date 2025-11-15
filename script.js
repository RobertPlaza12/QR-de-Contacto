const form = document.getElementById("multiForm");
const steps = Array.from(document.querySelectorAll(".step"));
const dots = Array.from(document.querySelectorAll(".step-dot"));
const stepsList = document.getElementById("stepsList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const progress = document.getElementById("progress");
const summaryBox = document.getElementById("summaryBox");

let paso = 0;

//carga datos locales
const saved = JSON.parse(localStorage.getItem("multiFormData") || "{}");
for (const [key, value] of Object.entries(saved)) {
  const el = form.elements[key];
  if (!el) continue;

  if (el.type === "file") {
    continue;
  } else if (el.type === "checkbox") {
    if (Array.isArray(value)) {
      el.forEach((input) => {
        input.checked = value.includes(input.value);
      });
    } else {
      el.checked = !!value;
    }
  } else if (el.type === "radio") {
    const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
    if (radio) radio.checked = true;
  } else {
    el.value = value;
  }
}

//  muestra el paso actual
function mostrarPaso(index) {
  steps.forEach((s) => s.classList.remove("active"));
  steps[index].classList.add("active");

  Array.from(stepsList.querySelectorAll("li")).forEach((li, i) => {
    const dot = li.querySelector(".step-dot");
    dot.classList.toggle("active", i === index);
  });

  // mostrar o ocultar botones
  prevBtn.style.display = index === 0 ? "none" : "inline-block";
  nextBtn.style.display = index === steps.length - 1 ? "none" : "inline-block";
  submitBtn.style.display = index === steps.length - 1 ? "inline-block" : "none";
  
  if (index === steps.length - 1) confirmacion();//si estamos en el último paso, mostrar resumen
}

//validoa los campos de cada paso
function validoarPaso(index) {
  const step = steps[index];
  const inputs = Array.from(step.querySelectorAll("input, select, textarea"));
  let valido = true;

  
  step.querySelectorAll(".error").forEach((e) => (e.textContent = ""));//para limpiar errores anteriores

  for (const input of inputs) {
    if (input.hasAttribute("required") && !input.value) {
      valido = false;
      setError(input, "Este campo es obligatorio");
      continue;
    }

    if (input.type === "email" && input.value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        valido = false;
        setError(input, "Correo inválido");
      }
    }

    if (input.pattern && input.value) {
      const re = new RegExp(input.pattern);
      if (!re.test(input.value)) {
        valido = false;
        setError(input, "Formato inválido");
      }
    }
  }

  return valido;
}

function setError(input, message) {
  const err = form.querySelector(`.error[data-for='${input.name || input.id}']`);
  if (err) err.textContent = message;
}

//guardar datos del paso actual en local
function guardarPaso(index) {
  const step = steps[index];
  const inputs = Array.from(step.querySelectorAll("input, select, textarea"));
  const data = JSON.parse(localStorage.getItem("multiFormData") || "{}");

  for (const input of inputs) {
    const key = input.name || input.id;
    if (!key) continue;
    if (input.type === "checkbox") data[key] = input.checked;
    else data[key] = input.value;
  }

  localStorage.setItem("multiFormData", JSON.stringify(data));
}

//saca la data del formulario como un objeto
function getdata() {
  const fd = new FormData(form);
  const obj = {};

  for (const [key, value] of fd.entries()) {
    if (key === "condiciones") {
      obj.condiciones = obj.condiciones || [];
      obj.condiciones.push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

//coloca el resumen en el recuadro final
function confirmacion() {
  const data = getdata();
  let html = "";

  html += `<strong>Nombre:</strong> ${data.nombre}<br>`;
  html += `<strong>Apellidos:</strong> ${data.apellido}<br>`;
  html += `<strong>Email:</strong> ${data.email}<br>`;
  html += `<strong>Telefono:</strong> ${data.telefono}<br>`;
  html += `<strong>Direccion:</strong> ${data.direccion}<hr>`;

  summaryBox.innerHTML = html;
}

//acciones de los botones 
nextBtn.addEventListener("click", () => {
  if (!validoarPaso(paso)) return;
  guardarPaso(paso);
  paso = Math.min(paso + 1, steps.length - 1);
  mostrarPaso(paso);
});

prevBtn.addEventListener("click", () => {
  paso = Math.max(0, paso - 1);
  mostrarPaso(paso);
});

// Permite hacer click en los pasos para navegar
stepsList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-step]");
  if (!li) return;
  const targetStep = Number(li.dataset.step);

  if (targetStep > paso) {
    // validoar pasos anteriores
    for (let i = paso; i < targetStep; i++) {
      if (!validoarPaso(i)) return;
      guardarPaso(i);
    }
  }

  paso = targetStep;
  mostrarPaso(paso);
});

//limita el comportamiento por defecto del Enter para que no envíe el formulario
form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    if (nextBtn.style.display !== "none") nextBtn.click();
    else if (submitBtn.style.display !== "none") submitBtn.click();
  }
});

document.getElementById("multiForm").addEventListener("submit", function(e){
    e.preventDefault(); 
    
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const direccion = document.getElementById("Direccion").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    // Crear el contenido del VCard
    const vcard =
    "BEGIN:VCARD\n" +
    "VERSION:3.0\n" +
    `N:${apellido};${nombre};;;\n` +
    `FN:${nombre} ${apellido}\n` +
    `TEL;TYPE=CELL:${telefono}\n` +
    `EMAIL:${email}\n` +
    `ADR;TYPE=HOME:;;${direccion};;;;\n` +
    "END:VCARD";

    let qrContainer = document.getElementById("qrResult");

    qrContainer.innerHTML = "<h3>Escanea este código para guardar el contacto:</h3>";

    // Generar QR
    new QRCode(qrContainer, {
        text: vcard,
        width: 250,
        height: 250
    });

    alert("QR generado correctamente. Escanéalo con tu teléfono.");
});


mostrarPaso(paso);
