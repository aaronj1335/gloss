define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'bedrock/class',
    'bedrock/mixins/assettable',
    './../widgets/widget',
    './widgetize',
    './binding'
], function($, _, t, Class, asSettable, Widget, widgetize, Binding) {
    var registry = Widget().registry;

    var BindingGroup = Class.extend({
        defaults: {
            name: 'main'
        },
        init: function(options) {
            this.bindings = [];
            this.set(_.extend({}, this.defaults, options));
        },
        _autoInstantiateBindings: function() {
            var self = this, root = self.get('$el')[0],
                widgets = self.get('widgets') || [],
                name = self.get('name');
            t.dfs(root, function(el, parentEl, ctrl) {
                var params, widget = _.find(widgets, function(w) {
                        return w.node === el? w : null;
                    }),
                    group = el.getAttribute('data-bind-group') || 'main';

                if (group === name && widget && widget.$node.attr('data-bind')) {
                    params = {
                        prop: widget.$node.attr('data-bind'),
                        twoWay: true,
                        widget: widget
                    };
                } else if (group === name && el.getAttribute('data-bind')) {
                    params = {prop: el.getAttribute('data-bind'), $el: $(el)};
                }

                if (params) {
                    ctrl.cutoff = true;
                    params.strings = [];
                    if (self.has('strings.field_errors.' + params.prop)) {
                        params.strings.push(
                            self.get('strings.field_errors.' + params.prop));
                    }
                    if (self.has('strings.errors')) {
                        params.strings.push(self.get('strings.errors'));
                    }
                    if (self.has('globalErrorStrings')) {
                        params.strings.push(self.get('globalErrorStrings'));
                    }
                    self.bindings.push(Binding(params));
                }
            });
        },
        update: function(changed) {
            var model;
            if (changed.$el) {
                this._autoInstantiateBindings();
            }
            if (changed.additionalBindings) {
                _.each(this.get('additionalBindings'), function(b) {
                    if (_.indexOf(this.bindings, b) < 0) {
                        this.bindings.push(b);
                    }
                });
            }
            if (changed.model) {
                model = this.get('model');
                _.each(this.bindings, function(binding) {
                    binding.set({model: model});
                });
            }
        }
    });

    asSettable.call(BindingGroup.prototype, {onChange: 'update'});

    return BindingGroup;
});
