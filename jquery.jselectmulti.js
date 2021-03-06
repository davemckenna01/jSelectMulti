(function($){




    $.fn.jSelectMulti = function(options) {

        ///////////////////////////////////////////////
        //Default settings
        var settings = {
            'searchable': true,
            'disable_form_submit_on_enter': true,
            'wrapper_class': 'jsm_wrapper',
            'wrapper_id_suffix': '_jsm_wrapper',
            'orig_wrapper_class': 'jsm_orig_wrapper',
            'new_wrapper_class': 'jsm_new_wrapper',
            'button_wrapper_class': 'jsm_buttons',
            'add_btn_class': 'jsm_add',
            'remove_btn_class': 'jsm_remove',
            'add_btn_text': 'Add',
            'remove_btn_text': 'Remove',
            'search_wrapper_class': 'search_wrapper',
            'search_title_class': 'search_title',
            'search_title_text': 'Search',
            'search_button_class': 'search_button',
            'search_button_text': 'Look up!',
            'search_input_class': 'search_input',
            'search_searching_class': 'search_searching',
            'search_searching_content': 'Searching...',
            'search_clearing_class': 'search_clearing',
            'search_clearing_content': 'Clearing...',
            'search_clear_class': 'search_clear',
            'search_clear_text': 'Clear search',
            'data_info_class': 'data_info'
        }

        //If options have been passed in,
        //merge them with our default settings
        if (options) {
            $.extend(settings, options);
        }
        /////////////////////////////////////////////////


        /////////////////////////////////////////////////
        //Begin Main Program


        //'this' is the current jQuery object. No need to wrap in $()
        var original_select = this;

        var wrapper_id = original_select.attr("name") + settings.wrapper_id_suffix;

        var new_select_id = original_select.attr('id') + "_to";

        create_markup();

        //update "X items in list" text
        update_data_info();

        //if page loads and select box has options selected already, (from
        //object updates, or form validation errors) then move them to
        //new select box
        assign_existing_options();

        init_event_handlers();

        //Prevent enter key presses (say, in the search field) from
        //submitting the form
        if (settings.disable_form_submit_on_enter){
            function stopRKey(evt) {
                //scrutinize this code more ...
                //just grabbed it off internet search.
                var evt = (evt) ? evt : ((event) ? event : null);
                var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
                if ((evt.keyCode == 13) && (node.type=="text"))  {return false;}
            }

            document.onkeypress = stopRKey;
        }
        
        //End Main Program
        ////////////////////////////////////////////////////



        function create_markup(){
            //create the wrapper element
            var wrapper_html = "<div class='" + settings.wrapper_class + "' ";
            wrapper_html +=         "id='" + wrapper_id + "' >";
            wrapper_html +=    "</div>";
            var wrapper = $(wrapper_html);

            //create the original select box wrapper element
            var orig_wrapper_html = "<div class='" + settings.orig_wrapper_class + "' >";
            orig_wrapper_html +=    "</div>";
            var orig_wrapper = $(orig_wrapper_html);

            //create the new select box wrapper element
            var new_wrapper_html = "<div class='" + settings.new_wrapper_class + "' >";
            new_wrapper_html +=    "</div>";
            var new_wrapper = $(new_wrapper_html);

            //create the button wrapper + elements
            var buttons_html = "<div class='" + settings.button_wrapper_class + "'>"
            buttons_html +=      "<div class='" + settings.add_btn_class + "'";
            buttons_html +=           "title='" + settings.add_btn_text + "'>"
            buttons_html +=            settings.add_btn_text + "</div>";
            buttons_html +=      "<div class='" + settings.remove_btn_class + "'"
            buttons_html +=           "title='" + settings.remove_btn_text + "'>"
            buttons_html +=            settings.remove_btn_text + "</div>";
            buttons_html +=    "</div>";
            var buttons = $(buttons_html);

            //info box@ bottom of orig_wrapper (shows # of objects, etc)
            var data_info_html = "<div class='"+settings.data_info_class+"'>";
            data_info_html +=    "</div>";
            var data_info = $(data_info_html);

            //create new select obj with same attributes as original
            var new_select = $("<select multiple='multiple'></select>");

            //new_select_id is defined near beginning of program
            new_select.attr('id', new_select_id);
            new_select.attr('name', original_select.attr('name'));

            //change attributes on original select obj
            original_select.attr('id', original_select.attr('id') + "_from");
            original_select.attr('name', original_select.attr('name') + "_old");

            //insert original, new, and btns into wrapper
            //This is awkward ... find a cleaner way
            original_select.after(wrapper);
            orig_wrapper.append(original_select);
            new_wrapper.append(new_select);
            $("#"+wrapper_id).append(orig_wrapper);
            $("#"+wrapper_id).append(buttons);
            $("#"+wrapper_id).append(new_wrapper);
            orig_wrapper.append(data_info);


            if (settings.searchable){
                var search_html = "<div class='"+settings.search_wrapper_class+"'>";
                search_html +=      "<div class='"+settings.search_title_class+"' ";
                search_html +=           "title='"+settings.search_title_text+"'>";
                search_html +=            settings.search_title_text;
                search_html +=      "</div>";
                search_html +=      "<input class='"+settings.search_input_class+"' />";
                search_html +=      "<span class='"+settings.search_clear_class+"' ";
                search_html +=           "title='"+settings.search_clear_text+"'>";
                search_html +=            settings.search_clear_text;
                search_html +=      "</span>";
                search_html +=      "<div class='"+settings.search_button_class+"' ";
                search_html +=           "title='"+settings.search_button_text+"'>";
                search_html +=            settings.search_button_text;
                search_html +=      "</div>";
                search_html +=      "<div class='"+settings.search_searching_class+"' ";
                search_html +=           "style='display:none;'>";
                search_html +=          settings.search_searching_content;
                search_html +=      "</div>";
                search_html +=      "<div class='"+settings.search_clearing_class+"' ";
                search_html +=           "style='display:none;'>";
                search_html +=          settings.search_clearing_content;
                search_html +=      "</div>";
                search_html +=    "</div>";
                var search = $(search_html);

                orig_wrapper.prepend(search);
            }


        }

        function get_orig_list_count(){
            var count = original_select[0].options.length;
            return count;
        }

        function update_data_info(){
            var count = get_orig_list_count();
            $("#"+wrapper_id + " ."+settings.data_info_class).html(
            count + " items in list."
            );
        }

        function assign_existing_options(){
            //This handles scenario when page loads and some options are already
            //selected - for example if it's an UPDATE or FORM VALIDATION FAILURE
            var from_opts = original_select.children('option:selected');
            $("#"+new_select_id).prepend(from_opts);
        }

        
        function init_event_handlers(){
            //move any _from options to _to
            $("#" + wrapper_id + " ." + settings.add_btn_class).bind('click.jSelectMulti', function(){

                if (original_select.children('option:selected').length > 0){
                    var from_opts = original_select.children('option:selected');
                    $("#"+new_select_id).prepend(from_opts);

                    if (settings.searchable){
                        var clone_opts=orig_box.data('clone').options;
                        var node;
                        for (var i=0; i < from_opts.length; i++){
                           for (var j=0; node = clone_opts[j]; j++){
                                if ($(from_opts[i]).val() == $(node).val()){
                                    $(node).remove();
                                }
                           }
                        }
                    }

                    update_data_info();

                    return true;
                }


            });

            //move any _to options back to _from
            $("#" + wrapper_id + " ." + settings.remove_btn_class).bind('click.jSelectMulti', function(){
                
                if ($("#"+new_select_id).children('option:selected').length > 0){
                    var to_opts = $("#"+new_select_id).children('option:selected');
                    original_select.prepend(to_opts);

                    if (settings.searchable){
                       for (var i=0; i < to_opts.length; i++){
                           $(orig_box.data('clone')).prepend($(to_opts[i]).clone()[0]);
                       }
                    }

                    update_data_info();

                    return true;
                }
            });

            //once form is submitted, catch the event, and select all in the _to box,
            //and return true to let the form carry on with it's submission work
            $("#"+new_select_id).parents("form").bind('submit.jSelectMulti',function(){
                $("#"+new_select_id).children('option').attr('selected', 'selected');
                return true;
            });


            //handles searching mechanism on search btn click
            if (settings.searchable){

                var orig_box = $($("select[name='"+original_select.attr('name')+"']")[0]);
				
                orig_box.data('clone', orig_box.clone()[0]);

                //Search Btn
                $("#"+wrapper_id + " ."+settings.search_button_class).bind("click.jSelectMulti", function(){
                    var start = new Date();

                    var input_field = $("#"+wrapper_id + " ."+settings.search_input_class);
                    var tokens = $.trim($(input_field).val().toLowerCase()).split(/\s+/);

                    //if empty search, don't do anything
                    if (tokens.length == 1 && tokens[0] == ""){return false;}

                    $("#"+wrapper_id + " ."+settings.search_searching_class).css('display','block');

                    //this is oh so hacky!! Needed to defer removal of elements from
                    //orig_box, b/c it was executing
                    setTimeout(do_search, 1);

                    function do_search(){
                        //Should tie up browser after this point...
                        //both remove() and html("") are slooowww
                        //orig_box.html("");
                        orig_box.children().remove();

                        //var options shows up as empty array in console.log...weird.
                        var options=orig_box.data('clone').options;

                        //do i need this var?
                        var clone=orig_box.data('clone');

                        var node, token;
                        for (var i = 0; (node = $(options[i]).clone()[0]); i++) {
                            for (var j = 0; (token = tokens[j]); j++) {
                                if (node.text.toLowerCase().indexOf(token) != -1) {
                                    orig_box.append(node);
                                }
                            }
                        }

                        //Search is complete, so remove loading indicator
                        $("#"+wrapper_id + " ."+settings.search_searching_class).css('display','none');
                        var finish = new Date();

                        var duration = finish.getSeconds() - start.getSeconds();

                        var count = get_orig_list_count();
                        $("#"+wrapper_id + " ."+settings.data_info_class).html(
                            "Found " + count + " results in " + duration + " seconds."
                        );

                    }

                    orig_box.data('showing_search_results', true);

                    return true;

                });

                //Clear Search Btn
                $("#"+wrapper_id + " ."+settings.search_clear_class).bind("click.jSelectMulti", function(){
                    
                    if(orig_box.data('showing_search_results')){

                        $("#"+wrapper_id + " ."+settings.search_clearing_class).css('display','block');

                        //similar hack as above
                        setTimeout(clear_search, 1);

                        function clear_search(){
                            orig_box.html($(orig_box.data('clone')).clone()[0].options);

                            $("#"+wrapper_id + " ."+settings.search_input_class).val("");
                            $("#"+wrapper_id + " ."+settings.search_clearing_class).css('display','none');

                            update_data_info();

                        }

                        orig_box.data('showing_search_results', false);

                        return true;
                    }

                });

                //Handle ENTER key presses on search field
                $("#"+wrapper_id + " ."+settings.search_input_class).bind('keyup.jSelectMulti', function(event){
                    if ((event.which && event.which == 13) || (event.keyCode && event.keyCode == 13)) {

                        //fire search buttons click event
                        $("#"+wrapper_id + " ."+settings.search_button_class).click();

                    }

                    return true;
                })

            }
        }

        //returning original jQuery object to maintain chainability
        return this;

    };




})(jQuery);