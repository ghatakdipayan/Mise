import React, { useState } from 'react';
import { Copy, Check, X, Shield, Terminal, MessageSquare, ExternalLink } from 'lucide-react';

interface SwiggyMcpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  missingItems: string[];
}

export const SwiggyMcpGuide: React.FC<SwiggyMcpGuideProps> = ({ isOpen, onClose, missingItems }) => {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const mcpConfig = JSON.stringify({
    mcpServers: {
      swiggy: {
        command: "npx",
        args: ["-y", "swiggy-mcp-server"]
      }
    }
  }, null, 2);

  const aiPrompt = `Please use the Swiggy Instamart MCP tools to find and add these ingredients to my cart: ${missingItems.join(', ')}. Once everything is added, please initiate the checkout process.`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-brand-light">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-brand-bg rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary p-2 rounded-lg text-white">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-dark">Swiggy MCP Ordering Assistant</h3>
              <p className="text-xs text-gray-500">Autonomous food ordering via Model Context Protocol</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Intro Card */}
          <div className="bg-brand-light/30 border border-brand-primary/20 rounded-xl p-4 flex gap-3 items-start">
            <Shield className="h-5 w-5 text-brand-primary mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-brand-text text-sm">How it works</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                By running Swiggy's official **Model Context Protocol (MCP)** server, you let your AI workspace (Claude Desktop, Cursor, etc.) securely search for items on Instamart, add them to your cart, and trigger checkout on your behalf.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-brand-dark font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center">1</span>
                <h4 className="font-bold text-brand-text text-sm">Configure Swiggy MCP Server</h4>
              </div>
              <p className="text-xs text-gray-600 pl-8">
                Add this configuration to your local MCP client settings file (e.g., `claude_desktop_config.json` at `%APPDATA%/Claude/claude_desktop_config.json` or `~/Library/Application Support/Claude/claude_desktop_config.json`):
              </p>
              
              <div className="pl-8 relative group">
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-xl font-mono overflow-x-auto leading-relaxed max-h-40">
                  {mcpConfig}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(mcpConfig, setCopiedConfig)}
                  className="absolute right-4 top-3 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-all focus:ring-2 focus:ring-brand-primary"
                  title="Copy configuration snippet"
                >
                  {copiedConfig ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-brand-dark font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center">2</span>
                <h4 className="font-bold text-brand-text text-sm">Send Prompt to your MCP-Enabled AI</h4>
              </div>
              <p className="text-xs text-gray-600 pl-8">
                Copy this preconfigured list of ingredients and paste it to your Claude, Cursor, or compatible assistant to automatically add them to your Swiggy Instamart cart:
              </p>

              <div className="pl-8 relative">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 pr-12 text-xs text-gray-700 italic leading-normal flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500 mt-1 flex-shrink-0" />
                  <span>"{aiPrompt}"</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(aiPrompt, setCopiedPrompt)}
                  className="absolute right-3 top-3 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm text-gray-600 p-2 rounded-lg transition-all focus:ring-2 focus:ring-brand-primary"
                  title="Copy AI Prompt"
                >
                  {copiedPrompt ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-brand-dark font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center">3</span>
                <h4 className="font-bold text-brand-text text-sm">Official Documentation</h4>
              </div>
              <p className="text-xs text-gray-600 pl-8">
                You can learn more about Swiggy's Model Context Protocol server, including food ordering and dineout bookings, in the official Swiggy GitHub repository:
              </p>
              <div className="pl-8">
                <a 
                  href="https://github.com/Swiggy/swiggy-mcp-server-manifest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:underline bg-brand-light/20 px-3 py-1.5 rounded-lg border border-brand-primary/10 transition-colors"
                >
                  View Swiggy MCP Repository <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 text-center">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-brand-primary hover:bg-brand-dark text-white rounded-full font-bold text-sm shadow transition-colors"
          >
            Ready, let's cook!
          </button>
        </div>

      </div>
    </div>
  );
};
