import { useFactoryStore } from "../stores/factory";
import { AvailablePeripheralBadge } from "./AvailablePeripheralBadge";

export function AvailablePeriphs() {
  const availablePeriphs = useFactoryStore(state => state.factory.available);

  return (
    <>
      {Object.keys(availablePeriphs).length > 0 && <div className="border p-3 border-2 rounded mcui-window flex flex-col items-center">
        <header>
          <h2>Available peripherals</h2>
          <span className="text-sm">Drag into factory to add</span>
        </header>

        <ul className="flex w-48 flex-wrap gap-2 mt-3 justify-around">
          {
            Object.keys(availablePeriphs).map(periphId => 
              <li
                key={periphId}
                draggable
                className="nodrag w-full mt-2 cursor-pointer inline-block contents"
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