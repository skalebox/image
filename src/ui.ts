import { IconPicture } from '@codexteam/icons';
import { make } from './utils/dom';
import type { API } from '@editorjs/editorjs';
import type { ImageToolData, ImageConfig } from './types/types';

/**
 * Enumeration representing the different states of the UI.
 */
enum UiState {
  /**
   * The UI is in an empty state, with no image loaded or being uploaded.
   */
  Empty = 'empty',

  /**
   * The UI is in an uploading state, indicating an image is currently being uploaded.
   */
  Uploading = 'uploading',

  /**
   * The UI is in a filled state, with an image successfully loaded.
   */
  Filled = 'filled'
};

/**
 * Nodes interface representing various elements in the UI.
 */
interface Nodes {
  /**
   * Wrapper element in the UI.
   */
  wrapper: HTMLElement;

  /**
   * Container for the image element in the UI.
   */
  imageContainer: HTMLElement;

  /**
   * Button for selecting files.
   */
  fileButton: HTMLElement;

  /**
   * Represents the image element in the UI, if one is present; otherwise, it's undefined.
   */
  imageEl?: HTMLElement;

  /**
   * Preloader element for the image.
   */
  imagePreloader: HTMLElement;

  /**
   * Caption element for the image.
   */
  caption: HTMLElement;
}

/**
 * ConstructorParams interface representing parameters for the Ui class constructor.
 */
interface ConstructorParams {
  /**
   * Editor.js API.
   */
  api: API;
  /**
   * Configuration for the image.
   */
  config: ImageConfig;
  /**
   * Callback function for selecting a file.
   */
  onSelectFile: () => void;
  /**
   * Flag indicating if the UI is in read-only mode.
   */
  readOnly: boolean;
}

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * Nodes representing various elements in the UI.
   */
  public nodes: Nodes;

  /**
   * API instance for Editor.js.
   */
  private api: API;

  /**
   * Configuration for the image tool.
   */
  private config: ImageConfig;

  /**
   * Callback function for selecting a file.
   */
  private onSelectFile: () => void;

  /**
   * Flag indicating if the UI is in read-only mode.
   */
  private readOnly: boolean;

  /**
   * @param ui - image tool Ui module
   * @param ui.api - Editor.js API
   * @param ui.config - user config
   * @param ui.onSelectFile - callback for clicks on Select file button
   * @param ui.readOnly - read-only mode flag
   */
  constructor({ api, config, onSelectFile, readOnly }: ConstructorParams) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make('div', [this.CSS.imageContainer]),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make('div', this.CSS.imagePreloader),
      caption: make('div'),
    };

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    // this.nodes.wrapper.appendChild(this.nodes.caption);
    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * Apply visual representation of activated tune
   * @param tuneName - one of available tunes {@link Tunes.tunes}
   * @param status - true for enable, false for disable
   */
  public applyTune(tuneName: string, status: boolean): void {
    this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
  }

  /**
   * Renders tool UI
   * @param toolData - saved tool data
   */
  public render(toolData: ImageToolData): HTMLElement {
    console.log('toolData', toolData);
    if (toolData.file === undefined || Object.keys(toolData.file).length === 0) {
      this.toggleStatus(UiState.Empty);
    } else {
      this.fillImage(toolData.file.url); // Mostrar la imagen inmediatamente
    }

    return this.nodes.wrapper;
  }

  /**
   * Hide uploading preloader
   */
  public hidePreloader(): void {
    this.nodes.imagePreloader.style.backgroundImage = '';
    this.toggleStatus(UiState.Empty);
  }

  /**
   * Shows an image
   * @param url - image source
   */
  public fillImage(url: string): void {
    const tag = /\.mp4$/.test(url) ? 'VIDEO' : 'IMG';

    const attributes: { [key: string]: string | boolean } = {
      src: url,
    };

    let eventName = 'load';

    if (tag === 'VIDEO') {
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;
      eventName = 'loadeddata';
    }

    // Create a temporary image element
    const tempImageEl = make(tag, this.CSS.imageEl, attributes);

    this.nodes.fileButton.style.display = 'none';
    this.nodes.fileButton.style.pointerEvents = 'none';

    tempImageEl.addEventListener(eventName, () => {
      // Once the new image is fully loaded, replace the visible image
      if (this.nodes.imageEl) {
        this.nodes.imageContainer.removeChild(this.nodes.imageEl);
      }
      this.nodes.imageEl = tempImageEl;
      this.nodes.imageContainer.appendChild(this.nodes.imageEl);

      this.toggleStatus(UiState.Filled);

      if (this.nodes.imagePreloader !== undefined) {
        this.nodes.imagePreloader.style.backgroundImage = '';
      }
    });

    // Do not add tempImageEl to the DOM until it is fully loaded
  }

  /**
   * Shows caption input
   * @param text - caption content text
   */
  public fillCaption(text: string): void {
    if (this.nodes.caption !== undefined) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * Clears the image from the UI
   */
  public clearImage(): void {
    // Implement the logic to clear the image from the UI
    const imageElement = this.nodes.imageEl;

    if (imageElement) {
      // @ts-expect-error: src is a valid attribute for image elements
      imageElement.src = ''; // Clear the image source
      imageElement.style.display = 'none'; // Optionally hide the image element

      // Make the file button visible and enabled
      this.nodes.fileButton.style.display = 'flex';
      this.nodes.fileButton.style.pointerEvents = 'auto';
    }
  }

  /**
   * CSS classes
   */
  private get CSS(): Record<string, string> {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'image-tool',
      imageContainer: 'image-tool__image',
      imagePreloader: 'image-tool__image-preloader',
      imageEl: 'image-tool__image-picture',
      caption: 'image-tool__caption',
    };
  };

  /**
   * Creates upload-file button
   */
  private createFileButton(): HTMLElement {
    const button = make('div', [this.CSS.button]);

    button.innerHTML = this.config.buttonContent ?? `${IconPicture} ${this.api.i18n.t('Select an Image')}`;

    button.addEventListener('click', () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Changes UI status
   * @param status - see {@link Ui.status} constants
   */
  private toggleStatus(status: UiState): void {
    for (const statusType in UiState) {
      if (Object.prototype.hasOwnProperty.call(UiState, statusType)) {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${UiState[statusType as keyof typeof UiState]}`, status === UiState[statusType as keyof typeof UiState]);
      }
    }
  }
}
