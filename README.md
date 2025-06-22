<h1 align="center">
<img src="https://raw.githubusercontent.com/HirokiCHIBA/timerange-clipboard/main/assets/icon/store.svg" alt="icon" width="128" height="128"><br>
Timerange Clipboard
</h1>

A Chrome Extension to copy and paste URL parameters in any format representing time ranges.  
This makes it easier to go back and forth between multiple monitoring tools with different timestamp formats (e.g. Datadog and Splunk).

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
Any websites that represent time ranges on display as timestamps in two URL query parameters. You can add websites from the options page. The built-in preset supports:

- Datadog
- Splunk
- Grafana
- Lightstep

Note: The providers of these websites are not affiliated with this extension. Please do not contact them about this extension.

## Future works

- Support for time range representations other than URL query parameters
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

### Build

```sh
npm run build
```

### Develop pages with preview

```sh
npm run dev
```
(Only options.html works so far.)
