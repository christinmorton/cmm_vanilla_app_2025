import tinymce from 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/models/dom/model';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/image';
import 'tinymce/plugins/media';
import 'tinymce/plugins/code';
import 'tinymce/plugins/paste';
import 'tinymce/skins/ui/oxide/skin.min.css';

class RichTextEditor {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.editorId = null;
        this.instance = null;
        this.options = this.mergeOptions(options);
        
        this.init();
    }

    mergeOptions(userOptions) {
        const defaultOptions = {
            // WordPress API configuration
            apiUrl: 'https://your-wp.com/wp-json/wp/v2',
            authType: 'basic', // 'basic', 'jwt', or 'none'
            credentials: {
                username: '',
                password: '', // or app password
                token: '' // for JWT
            },
            
            // TinyMCE configuration
            skin: false,
            content_css: false,
            plugins: 'link lists table image media code paste',
            toolbar: 'undo redo | styles | bold italic underline | bullist numlist | link image media table | alignleft aligncenter alignright | outdent indent | removeformat | code',
            base_url: '/tinymce',
            block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
            style_formats_merge: true,
            entity_encoding: 'raw',
            
            // Editor appearance
            height: 400,
            menubar: false,
            branding: false,
            resize: true,
            
            // Content validation
            valid_elements: '*[*]', // Allow all elements and attributes (WordPress compatible)
            extended_valid_elements: 'iframe[*]', // Allow iframes for embeds
            
            // Custom callbacks
            onInit: null,
            onChange: null,
            onImageUpload: null
        };

        return { ...defaultOptions, ...userOptions };
    }

    async init() {
        try {
            const config = {
                selector: this.selector,
                skin: this.options.skin,
                content_css: this.options.content_css,
                plugins: this.options.plugins,
                toolbar: this.options.toolbar,
                base_url: this.options.base_url,
                block_formats: this.options.block_formats,
                style_formats_merge: this.options.style_formats_merge,
                entity_encoding: this.options.entity_encoding,
                height: this.options.height,
                menubar: this.options.menubar,
                branding: this.options.branding,
                resize: this.options.resize,
                valid_elements: this.options.valid_elements,
                extended_valid_elements: this.options.extended_valid_elements,
                
                // Image upload handler
                images_upload_handler: this.createImageUploadHandler(),
                
                // Setup callback
                setup: (editor) => {
                    this.editorId = editor.id;
                    
                    editor.on('init', () => {
                        this.instance = editor;
                        if (this.options.onInit) {
                            this.options.onInit(editor);
                        }
                    });
                    
                    editor.on('change input', () => {
                        if (this.options.onChange) {
                            this.options.onChange(editor.getContent(), editor);
                        }
                    });
                }
            };

            await tinymce.init(config);
            return this.instance;
        } catch (error) {
            console.error('Failed to initialize TinyMCE editor:', error);
            throw error;
        }
    }

    createImageUploadHandler() {
        return async (blobInfo, progress) => {
            try {
                const form = new FormData();
                form.append('file', blobInfo.blob(), blobInfo.filename());

                const headers = {
                    'Content-Disposition': `attachment; filename="${blobInfo.filename()}"`
                };

                // Add authentication headers
                this.addAuthHeaders(headers);

                const response = await fetch(`${this.options.apiUrl}/media`, {
                    method: 'POST',
                    headers,
                    body: form
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                }

                const media = await response.json();
                
                // Custom callback for image upload
                if (this.options.onImageUpload) {
                    this.options.onImageUpload(media, blobInfo);
                }

                return media.source_url || media.guid?.rendered;
            } catch (error) {
                console.error('Image upload failed:', error);
                throw error;
            }
        };
    }

    addAuthHeaders(headers) {
        if (this.options.authType === 'basic' && this.options.credentials.username && this.options.credentials.password) {
            headers.Authorization = `Basic ${btoa(`${this.options.credentials.username}:${this.options.credentials.password}`)}`;
        } else if (this.options.authType === 'jwt' && this.options.credentials.token) {
            headers.Authorization = `Bearer ${this.options.credentials.token}`;
        }
    }

    // Public methods for interacting with the editor
    getContent(format = 'html') {
        return this.instance ? this.instance.getContent({ format }) : '';
    }

    setContent(content, format = 'html') {
        if (this.instance) {
            this.instance.setContent(content, { format });
        }
    }

    insertContent(content) {
        if (this.instance) {
            this.instance.insertContent(content);
        }
    }

    focus() {
        if (this.instance) {
            this.instance.focus();
        }
    }

    disable() {
        if (this.instance) {
            this.instance.setMode('readonly');
        }
    }

    enable() {
        if (this.instance) {
            this.instance.setMode('design');
        }
    }

    // WordPress specific methods
    async createPost(title, content, status = 'draft', additionalData = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            this.addAuthHeaders(headers);

            const postData = {
                title,
                content,
                status,
                ...additionalData
            };

            const response = await fetch(`${this.options.apiUrl}/posts`, {
                method: 'POST',
                headers,
                body: JSON.stringify(postData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create post: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create post:', error);
            throw error;
        }
    }

    async updatePost(postId, updates) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            this.addAuthHeaders(headers);

            const response = await fetch(`${this.options.apiUrl}/posts/${postId}`, {
                method: 'POST', // WordPress uses POST for updates
                headers,
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update post: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to update post:', error);
            throw error;
        }
    }

    async saveAsDraft() {
        const content = this.getContent();
        const title = document.querySelector('[data-post-title]')?.value || 'Untitled Post';
        
        return await this.createPost(title, content, 'draft');
    }

    async publish() {
        const content = this.getContent();
        const title = document.querySelector('[data-post-title]')?.value || 'Untitled Post';
        
        return await this.createPost(title, content, 'publish');
    }

    // Cleanup
    destroy() {
        if (this.instance) {
            tinymce.get(this.editorId)?.destroy();
            this.instance = null;
            this.editorId = null;
        }
    }

    // Static method for creating multiple editors
    static createEditor(selector, options = {}) {
        return new RichTextEditor(selector, options);
    }

    // Static method for destroying all editors
    static destroyAll() {
        tinymce.remove();
    }
}

export default RichTextEditor;