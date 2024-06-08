import { useFactoryStore } from "../stores/factory";

export function MissingPeriphs() {
  const missingPeriphs = useFactoryStore(state => state.factory.missing);

  return (
    <>
      <ul>
        {
          Object.keys(missingPeriphs).map(periphId => 
            <li key={periphId}>{periphId}</li>
          )
        }
      </ul>
    </>
  );
}