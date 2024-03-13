fetch('menu.json')
  .then(response => response.json())
  .then(data => {
    const menuData = data;
    menu.json
  })
  .catch(error => console.error('Error al cargar el JSON:', error));


let seleccion = {};
let diasPorMenu = {};
let menusSeleccionados = 0;
let categoriaActual = "Desayuno";
let categorias = ["Desayuno", "Snack", "Comida", "Snack", "Cena"];
let indiceCategoriaActual = 0;

function normalizarIngrediente(ingrediente) {
    return ingrediente
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/s$/, '') // Elimina la 's' al final para normalizar plurales
        .replace(/^\w/, (c) => c.toUpperCase()); // Capitaliza la primera letra
}

function displayDropdownCategorias() {
    const container = document.getElementById('menu-container');
    container.innerHTML = `<h2>Elige tu opción de ${categoriaActual}</h2>`;
    
    const dropdown = document.createElement('select');
    dropdown.id = 'categoria-select';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Selecciona una opción';
    dropdown.appendChild(defaultOption);

    const opcionesCategoria = menuData.filter(item => item.categoria === categoriaActual);
    opcionesCategoria.forEach((opcion, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = `Opción ${index + 1}: ${opcion.platillos.map(p => p.nombre).join(', ')}`;
        dropdown.appendChild(option);
    });

    const botonAceptar = document.createElement('button');
    botonAceptar.innerText = 'Aceptar';
    botonAceptar.onclick = confirmarSeleccion;

    container.appendChild(dropdown);
    container.appendChild(botonAceptar);
}

function confirmarSeleccion() {
    const selectElement = document.getElementById('categoria-select');
    const selectedIndex = selectElement.value;
    
    if (selectedIndex !== '') {
        if (!seleccion[menusSeleccionados]) {
            seleccion[menusSeleccionados] = {};
            diasPorMenu[menusSeleccionados] = 0;
        }
        
        let claveSeleccion = categoriaActual;
        if (categoriaActual === "Snack") {
            claveSeleccion += indiceCategoriaActual === 1 ? "1" : "2";
        }

        seleccion[menusSeleccionados][claveSeleccion] = menuData.filter(item => item.categoria === categoriaActual)[selectedIndex];

        indiceCategoriaActual++;
        if (indiceCategoriaActual < categorias.length) {
            categoriaActual = categorias[indiceCategoriaActual];
            displayDropdownCategorias();
        } else {
            displayDiasRestantes();
        }
    } else {
        alert('Por favor, selecciona una opción.');
    }
}

function displayDiasRestantes() {
    const container = document.getElementById('menu-container');
    container.innerHTML = `<h2>¿Para cuántos días es este menú?</h2>`;
    
    const dropdown = document.createElement('select');
    dropdown.id = 'dias-select';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Selecciona una opción';
    dropdown.appendChild(defaultOption);

    const diasRestantes = 7 - Object.values(diasPorMenu).reduce((acc, val) => acc + val, 0);
    for (let i = 1; i <= diasRestantes; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = `${i} día(s)`;
        dropdown.appendChild(option);
    }

    const botonAceptar = document.createElement('button');
    botonAceptar.innerText = 'Aceptar';
    botonAceptar.onclick = () => {
        const seleccionDias = parseInt(document.getElementById('dias-select').value);
        if (seleccionDias) {
            diasPorMenu[menusSeleccionados] = seleccionDias;
            menusSeleccionados++;
            if (Object.values(diasPorMenu).reduce((acc, val) => acc + val, 0) < 7) {
                resetearSeleccion();
                displayDropdownCategorias();
            } else {
                generarResumenYListaDeCompras();
            }
        } else {
            alert('Por favor, selecciona una opción.');
        }
    };

    container.appendChild(dropdown);
    container.appendChild(botonAceptar);
}

function resetearSeleccion() {
    categoriaActual = "Desayuno";
    indiceCategoriaActual = 0;
}

function generarResumenYListaDeCompras() {
    let listaDeCompras = {};
    let resumenMenu = '';

    Object.keys(seleccion).forEach((menuId) => {
        resumenMenu += `<div class="contenedor-resumen"><h2>Menú ${parseInt(menuId) + 1}</h2>`;
        let contadorSnack = 1;
        categorias.forEach((categoriaOriginal) => {
            let categoria = categoriaOriginal;
            if (categoria === "Snack") {
                categoria += contadorSnack++;
            }

            if (seleccion[menuId][categoria] != null) {
                resumenMenu += `<div class="tarjeta-categoria"><h3>${categoria}</h3>`;
                seleccion[menuId][categoria].platillos.forEach((platillo) => {
                    resumenMenu += `<div class="platillo"><strong>${platillo.nombre}</strong><ul>`;
                    platillo.ingredientes.forEach(({ ingrediente, cantidad, unidad, cantidad_alternativa, unidad_alternativa }) => {
                        const ingredienteNormalizado = normalizarIngrediente(ingrediente);
                        if (!listaDeCompras[ingredienteNormalizado]) {
                            listaDeCompras[ingredienteNormalizado] = { cantidad: 0, unidad };
                        }
                        listaDeCompras[ingredienteNormalizado].cantidad += cantidad * diasPorMenu[menuId];

                        let textoCantidad = `${cantidad} ${unidad}`;
                        if (cantidad_alternativa && unidad_alternativa) {
                            textoCantidad += ` (${cantidad_alternativa} ${unidad_alternativa})`;
                        }

                        resumenMenu += `<li>${ingrediente}: ${textoCantidad}</li>`;
                    });
                    resumenMenu += '</ul></div>';
                    resumenMenu += '<div class="espacio-entre-platillos"></div>';
                });
                resumenMenu += '</div>';
            }
        });
        resumenMenu += '</div>';
    });

    let listaDeComprasParaLaSemana = Object.entries(listaDeCompras).map(([ingrediente, { cantidad, unidad }]) => {
        return `<li>${ingrediente}: ${Math.ceil(cantidad)} ${unidad}</li>`;
    });

    const container = document.getElementById('menu-container');
    container.innerHTML = `${resumenMenu}<h2>Lista de la compra para la semana</h2><ul class="lista-de-compras">${listaDeComprasParaLaSemana.join('')}</ul>`;
}

displayDropdownCategorias();
