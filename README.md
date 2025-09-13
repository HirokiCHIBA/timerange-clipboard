<h1 align="center">
<img src="https://raw.githubusercontent.com/HirokiCHIBA/timerange-clipboard/main/assets/icon/store.svg" alt="icon" width="128" height="128"><br>
Timerange Clipboard
</h1>

A Chrome extension that makes it easy to copy and paste time ranges in URLs between different web pages.  
This extension allows time ranges to be converted into a format compatible with each web page. This helps compare information for the same time range across web pages with different timestamp formats (e.g. Datadog and CloudWatch).

## Install

* From [Chrome Web Store](https://chrome.google.com/webstore/detail/timerange-clipboard/gbofkihmogiigjdalkplkjheholghbfc) (recommended)
* Load as [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked)
  * Download & unzip released timerange-clipboard-*.zip or [build package](#build) yourself

## Usage

The icon of this extension will be colored when you visit websites where this extension supports copy and paste of time ranges. Click on the icon to open the popup and click on the Copy or Paste button. Keyboard shortcuts for Copy/Paste are also available.

<div align="center">
<img src="https://raw.githubusercontent.com/HirokiCHIBA/timerange-clipboard/main/assets/dist/store/screenshot1.png" alt="screenshot" width="600">
</div>

## Supported websites

Any website that represents time ranges being displayed using either start and end timestamps, or one of them along with a duration, in its URL. The built-in preset supports:

- Datadog
- Splunk
- Grafana
- Lightstep
- Cloudwatch

Note: The providers of these websites are not affiliated with this extension. Please do not contact them about this extension.

## Future works

- Support for relative time representations that are not timestamps (e.g. from=now-1h&to=now)
- Support for a non-developer friendly configuration UI

Note: There is no guarantee that these will be implemented.

## Development

### Requirements

* Node.js v18

### setup

```sh
npm install
```

### Lint

```sh
npm run lint
```

### Test

```sh
npm test
```

### Build

```sh
npm run build
```

### Develop pages with preview

```sh
npm run dev
```
(Only options.html works so far.)
