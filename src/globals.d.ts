declare const VERSION: string

declare module '*.yaml' {
  const content: string
  export default content
}
