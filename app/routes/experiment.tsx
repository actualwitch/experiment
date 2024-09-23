import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { SidebarInput } from "~/navigation";
import { experimentIdsAtom, Message, store } from "~/state/common";
import { Message as MessageComponent } from "~/style";
import { View } from "~/view";
export const loader = async () => {
  return { experimentIds: store.get(experimentIdsAtom) };
};

export const renderMessage = (message: Message, idx: number) => (
  <MessageComponent key={idx} role={message.role} ioType={message.fromServer ? "output" : "input"} isSelected={false}>
    <View>{message.content}</View>
  </MessageComponent>
);

export default function Experiment() {
  //   const [experimentIds] = useAtom(experimentIdsAtom);
  const { experimentIds } = useLoaderData<typeof loader>();
  return (
    <>
      <Outlet />
      <SidebarInput>
        <h3>Experiments</h3>
        <ul>
          {experimentIds.map(([id, subId]) => (
            <li key={id}>
              <NavLink to={`/experiment/lite/${id}/${subId}`}>
                Experiment #{id}.{subId}
              </NavLink>
            </li>
          ))}
        </ul>
      </SidebarInput>
    </>
  );
}
