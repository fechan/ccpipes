import { useFactoryStore } from "../stores/factory";
import { AvailablePeripheralBadge } from "./AvailablePeripheralBadge";

export function AvailablePeriphs() {
  const availablePeriphs = useFactoryStore(state => state.factory.available);

  return (
    <>
      {Object.keys(availablePeriphs).length > 0 && <div className="border p-3 border-2 rounded mcui-window">
        <header>
          <h2>Available peripherals</h2>
          <span className="text-sm">Drag into factory to add</span>
        </header>

        <ul>
          {
            Object.keys(availablePeriphs).map(periphId => 
              <li
                key={periphId}
                draggable
                className="nodrag w-full mt-2 cursor-pointer hover:-top-0.5 relative"
              >
                <AvailablePeripheralBadge periphId={ periphId } />
              </li>
            )
          }
        </ul>
      </div>}
    </>
  );
}