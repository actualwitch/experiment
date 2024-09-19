import { createAction, createStreamLoader } from "~/createLoader";
import { createSubscription } from "~/createSubscription";
import { entangledAtoms } from "~/state/common";


export const portalSubscription = createSubscription("/portal", entangledAtoms);

export const loader = createStreamLoader(entangledAtoms);

export const action = createAction(entangledAtoms);