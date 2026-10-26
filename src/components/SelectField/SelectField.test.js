import React from "react";
import { createRoot } from "react-dom/client";
import { act, Simulate } from "react-dom/test-utils";
import SelectField from "./SelectField";
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
const render = props => act(() => root.render(<SelectField id="quantity" label="Quantidade" value={50} options={[10, 50, 100].map(value => ({ value, label: String(value) }))} {...props} />));
test("teclado navega, seleciona valor numérico e devolve foco ao campo", () => {
  const onChange = jest.fn(); render({ onChange });
  const trigger = host.querySelector('[role="combobox"]');
  act(() => Simulate.keyDown(trigger, { key: "ArrowDown" }));
  expect(document.activeElement.textContent).toBe("50");
  act(() => Simulate.keyDown(document.activeElement, { key: "ArrowDown", preventDefault: jest.fn() }));
  expect(document.activeElement.textContent).toBe("100");
  act(() => document.activeElement.click());
  expect(onChange).toHaveBeenCalledWith(100);
  expect(trigger.getAttribute('aria-expanded')).toBe("false"); expect(document.activeElement).toBe(trigger);
});
test("Escape e clique fora fecham opções; campo desabilitado não abre", () => {
  render({}); const trigger = host.querySelector('button');
  act(() => trigger.click());
  act(() => Simulate.keyDown(document.activeElement, { key: "Escape", preventDefault: jest.fn() }));
  expect(host.querySelector('[role="listbox"]')).toBeNull();
  act(() => trigger.click());
  act(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
  expect(host.querySelector('[role="listbox"]')).toBeNull();
  render({ disabled: true }); act(() => trigger.click());
  expect(host.querySelector('[role="listbox"]')).toBeNull();
});
