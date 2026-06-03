export function render(
    container,
    component
) {

    container.innerHTML = "";

    container.append(
        component.render()
    );

} 
