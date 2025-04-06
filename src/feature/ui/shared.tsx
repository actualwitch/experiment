import styled from "@emotion/styled";
import { bs } from "../../style";

export const Label = styled.label``;

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  label {
    display: block;
    text-align: left;
    margin-bottom: ${bs(1 / 3)};
    i {
      opacity: 0.5;
      font-size: 15px;
    }
  }
`;
