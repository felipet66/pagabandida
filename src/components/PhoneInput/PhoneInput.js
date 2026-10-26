import React, { useState } from "react";
import InputMask from "react-input-mask";
import { Input } from "reactstrap";

const PhoneInput = ({ className, ...props }) => {
  const [mask, setMask] = useState("(99) 99999-9999");

  return (
    <InputMask
      {...props}
      mask={mask}
      onBlur={e => {
        if (e.target.value.replace("_", "").length === 14) {
          setMask("(99) 9999-9999");
        }
        if (props.onBlur) props.onBlur(e);
      }}
      onFocus={e => {
        if (e.target.value.replace("_", "").length === 14) {
          setMask("(99) 99999-9999");
        }
        if (props.onFocus) props.onFocus(e);
      }}
    >
      {inputProps => <Input {...inputProps} className={className} type="tel" />}
    </InputMask>
  );
};

export default PhoneInput;
