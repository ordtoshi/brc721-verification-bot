import cx from "classnames";

export const Button = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) => {
  const { className, ...rest } = props;

  const classes = cx(
    "px-6 py-2.5 mt-5 bg-brc-orange hover:opacity-90 text-neutral-800",
    className
  );

  return <button className={classes} {...rest} />;
};
